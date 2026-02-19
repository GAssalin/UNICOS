package br.com.unicos.ms_pagamentos.service;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProcessamentoGatewayResponse {
    private boolean aprovado;
    private String descricao;
    private String codigoAutorizacao;
    private String nsu;
}
