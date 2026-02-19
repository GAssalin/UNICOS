CREATE TABLE IF NOT EXISTS pagamento (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id BIGINT NOT NULL,
    venda_id BIGINT NULL,
    compra_id BIGINT NULL,
    valor DECIMAL(15,2) NOT NULL,
    forma_pagamento VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    codigo_transacao VARCHAR(100) NULL,
    data_vencimento DATE NULL,
    data_pagamento TIMESTAMP NULL,
    descricao VARCHAR(500) NULL,
    observacao VARCHAR(500) NULL,
    tenant_id VARCHAR(36) NULL,
    tenant_name VARCHAR(120) NULL,
    usuario_id BIGINT NULL,
    usuario_nome VARCHAR(255) NULL,
    data_criacao DATETIME NULL,
    data_alteracao DATETIME NULL,
    PRIMARY KEY (id)
);

CREATE INDEX idx_pagamento_empresa ON pagamento (empresa_id);
CREATE INDEX idx_pagamento_status ON pagamento (status);
CREATE UNIQUE INDEX uk_pagamento_codigo_transacao ON pagamento (codigo_transacao);
