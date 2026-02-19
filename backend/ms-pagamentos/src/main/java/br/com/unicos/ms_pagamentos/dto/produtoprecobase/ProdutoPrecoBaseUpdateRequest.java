package br.com.unicos.ms_pagamentos.dto.produtoprecobase;

import java.math.BigDecimal;

public record ProdutoPrecoBaseUpdateRequest(
        BigDecimal custoBase,
        BigDecimal precoVendaBase,
        BigDecimal margemBase
) {}
