package br.com.unicos.ms_pagamentos.dto.produtoatributovalor;

import jakarta.validation.constraints.NotBlank;

public record ProdutoAtributoValorUpdateRequest(
        @NotBlank String valor
) {}
