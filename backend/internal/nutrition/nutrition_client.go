package nutrition

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

// Macros are per-100g values used to scale to a logged quantity.
type Macros struct {
	FoodName string  `json:"food_name"`
	Calories float64 `json:"calories_per_100g"`
	ProteinG float64 `json:"protein_g_per_100g"`
	CarbsG   float64 `json:"carbs_g_per_100g"`
	FatG     float64 `json:"fat_g_per_100g"`
}

// Client wraps a nutrition database API (default: USDA FoodData Central).
// Swap BaseURL/apiKey to point at Nutritionix/Edamam instead if preferred —
// the interface (Lookup by food name -> per-100g macros) stays the same.
type Client struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

func NewClient(apiKey, baseURL string) *Client {
	return &Client{
		apiKey:     apiKey,
		baseURL:    baseURL,
		httpClient: &http.Client{},
	}
}

// Lookup finds the best-matching food and returns its per-100g macros.
// TODO: cache results locally (a lot of common foods repeat across users)
// instead of hitting the external API on every meal log.
func (c *Client) Lookup(ctx context.Context, foodName string) (*Macros, error) {
	endpoint := fmt.Sprintf("%s/foods/search?query=%s&api_key=%s&pageSize=1",
		c.baseURL, url.QueryEscape(foodName), c.apiKey)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("nutrition lookup failed: %s: %s", resp.Status, string(body))
	}

	var parsed struct {
		Foods []struct {
			Description   string `json:"description"`
			FoodNutrients []struct {
				NutrientName string  `json:"nutrientName"`
				Value        float64 `json:"value"`
			} `json:"foodNutrients"`
		} `json:"foods"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, err
	}
	if len(parsed.Foods) == 0 {
		return nil, fmt.Errorf("no nutrition match for %q", foodName)
	}

	food := parsed.Foods[0]
	macros := &Macros{FoodName: food.Description}
	for _, n := range food.FoodNutrients {
		switch n.NutrientName {
		case "Energy":
			macros.Calories = n.Value
		case "Protein":
			macros.ProteinG = n.Value
		case "Carbohydrate, by difference":
			macros.CarbsG = n.Value
		case "Total lipid (fat)":
			macros.FatG = n.Value
		}
	}

	return macros, nil
}
