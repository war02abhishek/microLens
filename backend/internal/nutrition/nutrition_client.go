package nutrition

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
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
// Tries USDA's curated generic-food datasets first (Foundation, SR Legacy)
// — plain text search alone ranks "Branded" grocery products by text
// relevance, which can match something like "BUTTER LETTUCE" for a query
// of "butter". Only falls back to an unrestricted search (any data type)
// if the curated sets have no match.
// TODO: cache results locally (a lot of common foods repeat across users)
// instead of hitting the external API on every meal log.
func (c *Client) Lookup(ctx context.Context, foodName string) (*Macros, error) {
	macros, err := c.search(ctx, foodName, []string{"Foundation", "SR Legacy"})
	if err == nil {
		return macros, nil
	}
	return c.search(ctx, foodName, nil)
}

func (c *Client) search(ctx context.Context, foodName string, dataTypes []string) (*Macros, error) {
	q := url.Values{}
	q.Set("query", foodName)
	q.Set("api_key", c.apiKey)
	q.Set("pageSize", "1")
	for _, dt := range dataTypes {
		q.Add("dataType", dt)
	}
	endpoint := fmt.Sprintf("%s/foods/search?%s", c.baseURL, q.Encode())

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
				UnitName     string  `json:"unitName"`
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
			// USDA reports Energy twice — once in kJ, once in kcal — so
			// this must be unit-gated, not just matched by name, or the
			// stored value is whichever unit happens to appear last in
			// the response.
			if strings.EqualFold(n.UnitName, "kcal") {
				macros.Calories = n.Value
			}
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
