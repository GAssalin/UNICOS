package br.com.unicos.ms_pagamentos.dto.produtoatributovalor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ProdutoAtributoValorCreateRequest(
        @NotNull Long produtoId,
        @NotNull Long atributoId,
        @NotBlank String valor
) {}
