CREATE TABLE IF NOT EXISTS pagamento (
    id CHAR(36) PRIMARY KEY,
    referencia_pedido VARCHAR(80) NOT NULL,
    valor DECIMAL(18,2) NOT NULL,
    moeda VARCHAR(3) NOT NULL,
    metodo VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    descricao_recusa VARCHAR(255),
    codigo_autorizacao VARCHAR(40),
    nsu VARCHAR(40),
    numero_cartao VARCHAR(25),
    chave_pix VARCHAR(120),
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_pagamento_referencia_pedido ON pagamento (referencia_pedido);
CREATE INDEX idx_pagamento_status ON pagamento (status);
