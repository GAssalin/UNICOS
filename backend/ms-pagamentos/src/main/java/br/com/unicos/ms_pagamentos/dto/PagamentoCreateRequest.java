package br.com.unicos.ms_pagamentos.dto;

import br.com.unicos.ms_pagamentos.model.MetodoPagamento;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PagamentoCreateRequest {

    @NotBlank
    private String referenciaPedido;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal valor;

    @NotBlank
    private String moeda;

    @NotNull
    private MetodoPagamento metodo;

    private String numeroCartao;
    private String chavePix;
}
