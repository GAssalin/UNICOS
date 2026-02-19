package br.com.unicos.ms_pagamentos.dto;

import br.com.unicos.ms_pagamentos.model.MetodoPagamento;
import br.com.unicos.ms_pagamentos.model.StatusPagamento;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class PagamentoResponse {
    private UUID id;
    private String referenciaPedido;
    private BigDecimal valor;
    private String moeda;
    private MetodoPagamento metodo;
    private StatusPagamento status;
    private String descricaoRecusa;
    private String codigoAutorizacao;
    private String nsu;
    private OffsetDateTime criadoEm;
    private OffsetDateTime atualizadoEm;
}
