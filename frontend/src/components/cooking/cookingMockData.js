export const DEFAULT_COOKING_RECIPE = {
  id: 'butter-chicken-demo',
  title: 'Classic Royal Butter Chicken (Murgh Makhani)',
  cuisine: 'Indian',
  difficulty: 'MEDIUM',
  prepTime: 20,
  cookTime: 35,
  servings: 4,
  nutrition: {
    calories: 540,
    protein: 38,
    carbohydrates: 14,
    fat: 36,
  },
  ingredients: [
    { name: 'Boneless Chicken Thighs (diced)', quantity: 800, unit: 'g' },
    { name: 'Plain Greek Yogurt', quantity: 1, unit: 'cup' },
    { name: 'Ginger-Garlic Paste', quantity: 2, unit: 'tbsp' },
    { name: 'Garam Masala', quantity: 1.5, unit: 'tsp' },
    { name: 'Kashmiri Chili Powder', quantity: 1, unit: 'tbsp' },
    { name: 'Ground Cumin', quantity: 1, unit: 'tsp' },
    { name: 'Ground Coriander', quantity: 1, unit: 'tsp' },
    { name: 'Fresh Lemon Juice', quantity: 1, unit: 'tbsp' },
    { name: 'Kosher Salt', quantity: 1.5, unit: 'tsp' },
    { name: 'Unsalted Butter', quantity: 4, unit: 'tbsp' },
    { name: 'Vegetable Oil', quantity: 1, unit: 'tbsp' },
    { name: 'Yellow Onion (finely diced)', quantity: 1, unit: 'large' },
    { name: 'Tomato Puree / Passata', quantity: 400, unit: 'g' },
    { name: 'Heavy Whipping Cream', quantity: 0.75, unit: 'cup' },
    { name: 'Dried Fenugreek Leaves (Kasuri Methi)', quantity: 1, unit: 'tbsp' },
  ],
  steps: [
    {
      title: 'Marinate the Chicken',
      instruction:
        'In a large glass bowl, combine the diced chicken with Greek yogurt, 1 tbsp ginger-garlic paste, 1 tsp Kashmiri chili, cumin, coriander, lemon juice, and 1 tsp salt. Mix until chicken is evenly coated and let sit for 15-20 minutes.',
      estimatedTime: 15,
      ingredients: ['Boneless Chicken Thighs', 'Greek Yogurt', 'Ginger-Garlic Paste', 'Chili Powder', 'Cumin', 'Lemon Juice'],
      tip: 'For maximum tenderness and depth, marinate in the refrigerator up to 4 hours in advance.',
    },
    {
      title: 'Sear the Marinated Chicken',
      instruction:
        'Heat 1 tbsp of vegetable oil in a heavy-bottomed skillet or Dutch oven over medium-high heat. Sear the chicken pieces in batches for 3-4 minutes per side until nicely browned with charred edges. Transfer chicken to a plate.',
      estimatedTime: 8,
      ingredients: ['Vegetable Oil', 'Marinated Chicken'],
      tip: 'Do not overcrowd the skillet; batching ensures the chicken sears rather than steams.',
    },
    {
      title: 'Sauté Onions & Aromatics',
      instruction:
        'Melt 2 tbsp of butter in the same pan over medium heat. Add the finely diced yellow onions and sauté for 5-6 minutes until soft, translucent, and lightly golden around the edges.',
      estimatedTime: 6,
      ingredients: ['Unsalted Butter', 'Yellow Onion'],
      tip: 'Use a wooden spoon to scrape up any browned fond stuck to the bottom of the pan for extra flavor.',
    },
    {
      title: 'Build the Spiced Gravy Base',
      instruction:
        'Stir in the remaining ginger-garlic paste, garam masala, and remaining chili powder. Cook for 1 minute until fragrant, then pour in the tomato puree and 1/2 tsp salt. Stir well to incorporate.',
      estimatedTime: 4,
      ingredients: ['Ginger-Garlic Paste', 'Garam Masala', 'Tomato Puree', 'Salt'],
      tip: 'Bloom the dry spices in warm butter for 30-40 seconds before adding tomatoes to release essential oils.',
    },
    {
      title: 'Simmer the Tomato Sauce',
      instruction:
        'Reduce the heat to medium-low, cover with a lid, and simmer the tomato gravy for 10-12 minutes until it thickens and droplets of oil begin to separate on the surface.',
      estimatedTime: 10,
      ingredients: ['Tomato Sauce base'],
      tip: 'Stir occasionally to ensure the tomatoes cook evenly and do not stick.',
    },
    {
      title: 'Blend in Heavy Cream & Butter',
      instruction:
        'Turn heat to low. Gently stir in the heavy whipping cream and remaining 2 tbsp of butter. Whisk continuously until the curry transforms into a silky, velvety orange sauce.',
      estimatedTime: 3,
      ingredients: ['Heavy Whipping Cream', 'Unsalted Butter'],
      tip: 'Keeping the heat low prevents the cream from splitting or curdling.',
    },
    {
      title: 'Combine Chicken & Kasuri Methi',
      instruction:
        'Add the seared chicken pieces and any resting juices back into the sauce. Simmer on low for 5 minutes. Crush the dried fenugreek leaves (kasuri methi) between your palms and stir into the curry.',
      estimatedTime: 5,
      ingredients: ['Seared Chicken', 'Dried Fenugreek Leaves (Kasuri Methi)'],
      tip: 'Crushing kasuri methi activates its distinctive smoky aroma and slight maple-like sweetness.',
    },
    {
      title: 'Garnish & Plate',
      instruction:
        'Turn off the heat. Drizzle with a swirl of fresh cream and top with chopped cilantro. Let rest for 2 minutes before serving alongside warm garlic naan or fragrant basmati rice.',
      estimatedTime: 2,
      ingredients: ['Cream Swirl', 'Fresh Cilantro', 'Garlic Naan / Rice'],
      tip: 'Resting the curry allows the rich butter and aromatic spices to settle into harmony.',
    },
  ],
};
