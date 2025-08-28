-- Provider: ollama
-- Default model: ollama/llama3.1:8b
-- OPENAI_BASE_URL: http://host.docker.internal:11434
INSERT INTO "refly"."model_infos" ("name", "label", "provider", "tier", "enabled", "is_default", "context_limit", "max_output", "capabilities")
VALUES 
    ('deepseek-r1:7b', 'DeepSeek R1 7B', 'deepseek', 't2', 't', 't', 131072, 32768, '{}'),
    ('deepseek-r1:14b', 'DeepSeek R1 14B', 'deepseek', 't2', 't', 'f', 131072, 32768, '{}'),
    ('llama3.3:70b', 'Llama 3.3 70B', 'meta-llama', 't2', 't', 'f', 131072, 8192, '{}');
