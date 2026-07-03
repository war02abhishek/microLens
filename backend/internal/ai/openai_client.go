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

// IdentifiedItem is one food item extracted from a photo or text description,
// before macro lookup. Quantity is the model's best estimate; Confidence
// drives the "AI is unsure" UI treatment from PRD §3.1.
type IdentifiedItem struct {
	FoodName      string  `json:"food_name"`
	QuantityValue float64 `json:"quantity_value"`
	QuantityUnit  string  `json:"quantity_unit"`
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
					"confidence":     map[string]any{"type": "number", "description": "0-1, how sure the model is about this item and its quantity"},
				},
				"required":             []string{"food_name", "quantity_value", "quantity_unit", "confidence"},
				"additionalProperties": false,
			},
		},
	},
	"required":             []string{"items"},
	"additionalProperties": false,
}

const systemPrompt = "You identify foods and estimate portion sizes from a meal photo or description. " +
	"Return every distinct food item with your best-guess quantity and a confidence score. " +
	"Always express quantity_value as an estimated weight in grams, with quantity_unit set to \"g\" " +
	"— convert everyday units yourself (e.g. \"2 boiled eggs\" is about 100g, \"a slice of toast\" is " +
	"about 30g, \"a tablespoon of butter\" is about 14g). This is required even when the input already " +
	"gives a count or volume, because downstream nutrition lookups scale strictly from grams. " +
	"Be conservative with confidence when the portion size or ingredient is ambiguous."

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
