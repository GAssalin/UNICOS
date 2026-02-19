package br.com.unicos.ms_pagamentos.dto.produtotipo;

import jakarta.validation.constraints.NotBlank;

public record ProdutoTipoCreateRequest(
        @NotBlank String nome,
        String descricao
) {}
