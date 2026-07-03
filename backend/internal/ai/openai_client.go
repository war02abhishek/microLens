package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const chatCompletionsURL = "https://api.openai.com/v1/chat/completions"

// Client wraps the OpenAI Chat Completions API for meal recognition.
type Client struct {
	apiKey     string
	model      string
	httpClient *http.Client
}

func NewClient(apiKey string) *Client {
	return &Client{
		apiKey:     apiKey,
		model:      "gpt-4o",
		httpClient: &http.Client{},
	}
}

// IdentifiedItem is one food item extracted from a photo or text
// description, with macros estimated directly by the model (no nutrition
// database lookup — see internal/nutrition for the alternate path, kept
// but currently unused). Quantity and macros are the model's best
// estimate for the whole item as described (not per-100g); Confidence
// drives the "AI is unsure" UI treatment from PRD §3.1.
type IdentifiedItem struct {
	FoodName      string  `json:"food_name"`
	QuantityValue float64 `json:"quantity_value"`
	QuantityUnit  string  `json:"quantity_unit"`
	Calories      float64 `json:"calories"`
	ProteinG      float64 `json:"protein_g"`
	CarbsG        float64 `json:"carbs_g"`
	FatG          float64 `json:"fat_g"`
	Confidence    float64 `json:"confidence"`
}

type identifyResponse struct {
	Items []IdentifiedItem `json:"items"`
}

// mealItemsSchema constrains the model's output to a strict, parseable shape.
var mealItemsSchema = map[string]any{
	"type": "object",
	"properties": map[string]any{
		"items": map[string]any{
			"type": "array",
			"items": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"food_name":      map[string]any{"type": "string"},
					"quantity_value": map[string]any{"type": "number"},
					"quantity_unit":  map[string]any{"type": "string", "description": "e.g. g, ml, piece, slice"},
					"calories":       map[string]any{"type": "number", "description": "estimated total calories for this item at the estimated quantity (not per 100g)"},
					"protein_g":      map[string]any{"type": "number", "description": "estimated total grams of protein for this item at the estimated quantity"},
					"carbs_g":        map[string]any{"type": "number", "description": "estimated total grams of carbohydrate for this item at the estimated quantity"},
					"fat_g":          map[string]any{"type": "number", "description": "estimated total grams of fat for this item at the estimated quantity"},
					"confidence":     map[string]any{"type": "number", "description": "0-1, how sure the model is about this item, its quantity, and its macros"},
				},
				"required":             []string{"food_name", "quantity_value", "quantity_unit", "calories", "protein_g", "carbs_g", "fat_g", "confidence"},
				"additionalProperties": false,
			},
		},
	},
	"required":             []string{"items"},
	"additionalProperties": false,
}

const systemPrompt = "You identify foods and estimate portion sizes and macros from a meal photo or description. " +
	"Return every distinct food item with your best-guess quantity and calories/protein/carbs/fat for " +
	"that specific quantity (not per 100g) — use your own nutrition knowledge, reasoning about typical " +
	"macro profiles for each food the way a careful nutrition-conscious cook would. Also express " +
	"quantity_value as an estimated weight in grams with quantity_unit set to \"g\" so portions are " +
	"comparable across items, converting everyday units yourself (e.g. \"2 boiled eggs\" is about 100g). " +
	"Be conservative with confidence when the food, portion size, or macro estimate is ambiguous. " +
	"If the photo or description does not actually show or describe real, identifiable food — for example " +
	"it's blank, a test pattern, a non-food object or scene, too blurry/dark to make out, or the text is " +
	"unrelated to eating — return an empty items array instead of guessing. Never invent food items that " +
	"aren't actually shown or described."

// IdentifyFromText parses a free-text meal description (e.g. "two eggs and a
// slice of toast") into structured food items.
func (c *Client) IdentifyFromText(ctx context.Context, description string) ([]IdentifiedItem, error) {
	content := []map[string]any{
		{"type": "text", "text": description},
	}
	return c.identify(ctx, content)
}

// IdentifyFromPhoto parses a meal photo (base64-encoded, with data URI prefix)
// into structured food items.
func (c *Client) IdentifyFromPhoto(ctx context.Context, imageDataURL string) ([]IdentifiedItem, error) {
	content := []map[string]any{
		{"type": "text", "text": "Identify the foods in this meal photo and estimate their portions."},
		{"type": "image_url", "image_url": map[string]string{"url": imageDataURL}},
	}
	return c.identify(ctx, content)
}

func (c *Client) identify(ctx context.Context, userContent []map[string]any) ([]IdentifiedItem, error) {
	body := map[string]any{
		"model": c.model,
		"messages": []map[string]any{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userContent},
		},
		"response_format": map[string]any{
			"type": "json_schema",
			"json_schema": map[string]any{
				"name":   "meal_items",
				"schema": mealItemsSchema,
				"strict": true,
			},
		},
	}

	payload, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, chatCompletionsURL, bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("openai request failed: %s: %s", resp.Status, string(respBody))
	}

	var parsed struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return nil, err
	}
	if len(parsed.Choices) == 0 {
		return nil, fmt.Errorf("openai returned no choices")
	}

	var result identifyResponse
	if err := json.Unmarshal([]byte(parsed.Choices[0].Message.Content), &result); err != nil {
		return nil, fmt.Errorf("failed to parse structured output: %w", err)
	}

	return result.Items, nil
}
