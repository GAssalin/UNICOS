package br.com.unicos.ms_pagamentos.dto.marca;

public record MarcaProdutoResumoResponse(
        Long id,
        String nome,
        Boolean ativo
) {}
