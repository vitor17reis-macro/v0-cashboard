-- Update existing categories with proper icons and colors
-- This script updates categories that have empty or null icons

-- Habitação / Housing
UPDATE categories SET 
  icon = 'Home',
  color = '#6366F1'
WHERE LOWER(name) IN ('habitação', 'habitacao', 'casa', 'renda', 'aluguel', 'mortgage', 'housing', 'rent')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Alimentação / Food  
UPDATE categories SET
  icon = 'UtensilsCrossed',
  color = '#F59E0B'
WHERE LOWER(name) IN ('alimentação', 'alimentacao', 'comida', 'supermercado', 'mercearia', 'food', 'groceries', 'restaurante', 'restaurant')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Transportes / Transportation
UPDATE categories SET
  icon = 'Car',
  color = '#3B82F6'
WHERE LOWER(name) IN ('transportes', 'transporte', 'carro', 'combustível', 'combustivel', 'gasolina', 'uber', 'taxi', 'transportation', 'car', 'fuel', 'gas')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Saúde / Health
UPDATE categories SET
  icon = 'Heart',
  color = '#EF4444'
WHERE LOWER(name) IN ('saúde', 'saude', 'health', 'médico', 'medico', 'farmácia', 'farmacia', 'hospital', 'doctor', 'pharmacy', 'medicine')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Educação / Education
UPDATE categories SET
  icon = 'GraduationCap',
  color = '#8B5CF6'
WHERE LOWER(name) IN ('educação', 'educacao', 'education', 'escola', 'universidade', 'curso', 'livros', 'school', 'university', 'books', 'learning')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Lazer / Entertainment
UPDATE categories SET
  icon = 'Gamepad2',
  color = '#EC4899'
WHERE LOWER(name) IN ('lazer', 'entretenimento', 'entertainment', 'diversão', 'diversao', 'cinema', 'jogos', 'games', 'fun', 'hobby')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Compras / Shopping
UPDATE categories SET
  icon = 'ShoppingBag',
  color = '#14B8A6'
WHERE LOWER(name) IN ('compras', 'shopping', 'roupa', 'vestuário', 'vestuario', 'clothes', 'clothing', 'loja', 'store')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Viagens / Travel
UPDATE categories SET
  icon = 'Plane',
  color = '#0EA5E9'
WHERE LOWER(name) IN ('viagens', 'viagem', 'travel', 'férias', 'ferias', 'vacation', 'hotel', 'voo', 'flight')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Contas / Bills & Utilities
UPDATE categories SET
  icon = 'Receipt',
  color = '#64748B'
WHERE LOWER(name) IN ('contas', 'bills', 'utilities', 'serviços', 'servicos', 'eletricidade', 'água', 'agua', 'internet', 'telefone', 'electricity', 'water', 'phone')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Assinaturas / Subscriptions
UPDATE categories SET
  icon = 'CreditCard',
  color = '#A855F7'
WHERE LOWER(name) IN ('assinaturas', 'subscriptions', 'netflix', 'spotify', 'streaming', 'subscription')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Salário / Salary
UPDATE categories SET
  icon = 'Briefcase',
  color = '#22C55E'
WHERE LOWER(name) IN ('salário', 'salario', 'salary', 'ordenado', 'rendimento', 'income', 'wage', 'trabalho', 'work')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Investimentos / Investments
UPDATE categories SET
  icon = 'TrendingUp',
  color = '#10B981'
WHERE LOWER(name) IN ('investimentos', 'investments', 'dividendos', 'dividends', 'juros', 'interest', 'rendimentos', 'returns')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Poupança / Savings
UPDATE categories SET
  icon = 'PiggyBank',
  color = '#F97316'
WHERE LOWER(name) IN ('poupança', 'poupanca', 'savings', 'reserva', 'emergency', 'emergência', 'emergencia')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Presentes / Gifts
UPDATE categories SET
  icon = 'Gift',
  color = '#DB2777'
WHERE LOWER(name) IN ('presentes', 'gifts', 'presente', 'gift', 'doação', 'doacao', 'donation')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Pets / Animals
UPDATE categories SET
  icon = 'PawPrint',
  color = '#84CC16'
WHERE LOWER(name) IN ('pets', 'animais', 'pet', 'animal', 'veterinário', 'veterinario', 'vet', 'cão', 'cao', 'gato', 'dog', 'cat')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Beleza / Beauty
UPDATE categories SET
  icon = 'Sparkles',
  color = '#F472B6'
WHERE LOWER(name) IN ('beleza', 'beauty', 'cabeleireiro', 'barbeiro', 'cosmética', 'cosmetica', 'spa', 'salon', 'haircut')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Desporto / Sports & Fitness
UPDATE categories SET
  icon = 'Dumbbell',
  color = '#06B6D4'
WHERE LOWER(name) IN ('desporto', 'fitness', 'gym', 'ginásio', 'ginasio', 'sports', 'exercise', 'exercício', 'exercicio')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Seguros / Insurance
UPDATE categories SET
  icon = 'Shield',
  color = '#1E40AF'
WHERE LOWER(name) IN ('seguros', 'insurance', 'seguro', 'proteção', 'protecao')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Impostos / Taxes
UPDATE categories SET
  icon = 'FileText',
  color = '#991B1B'
WHERE LOWER(name) IN ('impostos', 'taxes', 'irs', 'tax', 'imposto')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Tecnologia / Technology
UPDATE categories SET
  icon = 'Laptop',
  color = '#374151'
WHERE LOWER(name) IN ('tecnologia', 'technology', 'tech', 'eletrónica', 'eletronica', 'electronics', 'gadgets', 'computador', 'computer')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Café / Coffee
UPDATE categories SET
  icon = 'Coffee',
  color = '#92400E'
WHERE LOWER(name) IN ('café', 'cafe', 'coffee', 'cafetaria', 'starbucks')
AND (icon IS NULL OR icon = '' OR icon = 'circle');

-- Outros / Other - Catch all for remaining empty icons
UPDATE categories SET
  icon = 'Wallet',
  color = '#6B7280'
WHERE (icon IS NULL OR icon = '' OR icon = 'circle');
