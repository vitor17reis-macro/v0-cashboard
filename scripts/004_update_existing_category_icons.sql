-- Script para atualizar os ícones e cores das categorias existentes
-- Execute este script para corrigir categorias sem ícone/cor

-- Alimentação
UPDATE categories SET icon = 'utensils', color = '#f97316' WHERE LOWER(name) LIKE '%alimenta%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'utensils', color = '#f97316' WHERE LOWER(name) LIKE '%comida%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'utensils', color = '#f97316' WHERE LOWER(name) LIKE '%restaurante%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'shopping', color = '#f97316' WHERE LOWER(name) LIKE '%supermercado%' AND (icon IS NULL OR icon = '' OR icon = 'tag');

-- Transportes
UPDATE categories SET icon = 'bus', color = '#3b82f6' WHERE LOWER(name) LIKE '%transporte%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'car', color = '#3b82f6' WHERE LOWER(name) LIKE '%carro%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'fuel', color = '#3b82f6' WHERE LOWER(name) LIKE '%combust%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'fuel', color = '#3b82f6' WHERE LOWER(name) LIKE '%gasolina%' AND (icon IS NULL OR icon = '' OR icon = 'tag');

-- Habitação
UPDATE categories SET icon = 'home', color = '#8b5cf6' WHERE LOWER(name) LIKE '%habita%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'home', color = '#8b5cf6' WHERE LOWER(name) LIKE '%casa%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'home', color = '#8b5cf6' WHERE LOWER(name) LIKE '%renda%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'plug', color = '#8b5cf6' WHERE LOWER(name) LIKE '%eletricidade%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'plug', color = '#8b5cf6' WHERE LOWER(name) LIKE '%utilidades%' AND (icon IS NULL OR icon = '' OR icon = 'tag');

-- Saúde
UPDATE categories SET icon = 'heart', color = '#ef4444' WHERE LOWER(name) LIKE '%sa_de%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'stethoscope', color = '#ef4444' WHERE LOWER(name) LIKE '%m_dico%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'pill', color = '#ef4444' WHERE LOWER(name) LIKE '%farm_cia%' AND (icon IS NULL OR icon = '' OR icon = 'tag');

-- Educação
UPDATE categories SET icon = 'graduation', color = '#06b6d4' WHERE LOWER(name) LIKE '%educa%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'book', color = '#06b6d4' WHERE LOWER(name) LIKE '%livro%' AND (icon IS NULL OR icon = '' OR icon = 'tag');

-- Lazer
UPDATE categories SET icon = 'film', color = '#ec4899' WHERE LOWER(name) LIKE '%entretenimento%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'gamepad', color = '#ec4899' WHERE LOWER(name) LIKE '%lazer%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'film', color = '#ec4899' WHERE LOWER(name) LIKE '%netflix%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'film', color = '#ec4899' WHERE LOWER(name) LIKE '%streaming%' AND (icon IS NULL OR icon = '' OR icon = 'tag');

-- Viagens
UPDATE categories SET icon = 'plane', color = '#0d9488' WHERE LOWER(name) LIKE '%viag%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'plane', color = '#0d9488' WHERE LOWER(name) LIKE '%f_rias%' AND (icon IS NULL OR icon = '' OR icon = 'tag');

-- Comunicações
UPDATE categories SET icon = 'wifi', color = '#06b6d4' WHERE LOWER(name) LIKE '%internet%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'smartphone', color = '#06b6d4' WHERE LOWER(name) LIKE '%telem_vel%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'smartphone', color = '#06b6d4' WHERE LOWER(name) LIKE '%telefone%' AND (icon IS NULL OR icon = '' OR icon = 'tag');

-- Receitas
UPDATE categories SET icon = 'banknote', color = '#059669' WHERE LOWER(name) LIKE '%sal_rio%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'banknote', color = '#059669' WHERE LOWER(name) LIKE '%salario%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'briefcase', color = '#059669' WHERE LOWER(name) LIKE '%trabalho%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'briefcase', color = '#059669' WHERE LOWER(name) LIKE '%freelance%' AND (icon IS NULL OR icon = '' OR icon = 'tag');

-- Outros
UPDATE categories SET icon = 'gift', color = '#ec4899' WHERE LOWER(name) LIKE '%presente%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'paw', color = '#f97316' WHERE LOWER(name) LIKE '%animais%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'paw', color = '#f97316' WHERE LOWER(name) LIKE '%pet%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'scissors', color = '#ec4899' WHERE LOWER(name) LIKE '%beleza%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'dumbbell', color = '#059669' WHERE LOWER(name) LIKE '%gin_sio%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'dumbbell', color = '#059669' WHERE LOWER(name) LIKE '%gym%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'shirt', color = '#8b5cf6' WHERE LOWER(name) LIKE '%roupa%' AND (icon IS NULL OR icon = '' OR icon = 'tag');
UPDATE categories SET icon = 'shirt', color = '#8b5cf6' WHERE LOWER(name) LIKE '%vestu_rio%' AND (icon IS NULL OR icon = '' OR icon = 'tag');

-- Definir um ícone padrão para categorias restantes sem ícone
UPDATE categories SET icon = 'tag', color = '#0d9488' WHERE icon IS NULL OR icon = '';
