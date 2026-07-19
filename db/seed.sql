-- Sample data for AgroShop
-- Run with: npm run db:setup   (or psql -f db/seed.sql after schema.sql)

BEGIN;

INSERT INTO categories (slug, name, description, icon) VALUES
    ('pesticide',  'Pesticides',       'Effective pest control solutions for all crop types', '🐛'),
    ('fertilizer', 'Fertilizers',      'Nutrient-rich formulas for optimal growth',            '🌿'),
    ('organic',    'Organic Products', 'Eco-friendly solutions for sustainable farming',       '♻️'),
    ('combo',      'Combo Packs',      'Complete solutions at special prices',                 '📦')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, description, price, category, icon, badge, stock) VALUES
    ('Neem Oil Concentrate',       'Cold-pressed neem oil, broad-spectrum organic pest control for vegetables and fruit trees.', 449.00,  'organic',    '🌿', 'Bestseller', 120),
    ('Cypermethrin 10% EC',        'Fast-acting insecticide for bollworm, aphids and stem borers in cotton and cereal crops.',     380.00,  'pesticide',  '🐛', NULL,         85),
    ('NPK 19:19:19 Water Soluble', 'Balanced macro-nutrient fertilizer for foliar and drip application across all crop stages.',   650.00,  'fertilizer', '🌾', 'Popular',    200),
    ('Vermicompost Organic 5kg',   'Pure earthworm compost — improves soil structure and microbial activity naturally.',           275.00,  'organic',    '🪱', NULL,         150),
    ('Imidacloprid 17.8% SL',      'Systemic insecticide effective against sucking pests: aphids, jassids and whiteflies.',        320.00,  'pesticide',  '🦟', NULL,         90),
    ('Humic Acid Granules',        'Soil conditioner that boosts root development and nutrient uptake efficiency.',                399.00,  'fertilizer', '🌱', 'New',        110),
    ('Kharif Combo Pack',          'Complete package: pesticide + fertilizer + micronutrient spray for the Kharif season.',       1899.00, 'combo',      '📦', 'Best Value', 40),
    ('Bio NPK Consortium',         'Liquid biofertilizer with nitrogen-fixing and phosphate-solubilizing bacteria.',               299.00,  'organic',    '🧪', NULL,         130),
    ('Mancozeb 75% WP Fungicide',  'Broad-spectrum protective fungicide for blight, rust and leaf spot diseases.',                 340.00,  'pesticide',  '🍂', NULL,         95),
    ('Rabi Combo Pack',            'Season bundle covering fertilizer, fungicide and growth promoter for Rabi crops.',            1699.00, 'combo',      '📦', 'Limited',    30),
    ('DAP Fertilizer 50kg',        'Di-ammonium phosphate for strong root establishment at sowing stage.',                        1450.00, 'fertilizer', '🌾', NULL,         60),
    ('Seaweed Growth Promoter',    'Organic bio-stimulant that improves flowering, fruiting and stress tolerance.',                420.00,  'organic',    '🌊', 'Trending',   75)
ON CONFLICT DO NOTHING;

COMMIT;
