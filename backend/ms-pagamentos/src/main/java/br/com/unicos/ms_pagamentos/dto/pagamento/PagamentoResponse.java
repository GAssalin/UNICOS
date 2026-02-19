package br.com.unicos.ms_pagamentos.dto.pagamento;

import br.com.unicos.ms_pagamentos.enums.FormaPagamento;
import br.com.unicos.ms_pagamentos.enums.StatusPagamento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record PagamentoResponse(
        Long id,
        Long empresaId,
        Long vendaId,
        Long compraId,
        BigDecimal valor,
        FormaPagamento formaPagamento,
        StatusPagamento status,
        String codigoTransacao,
        LocalDate dataVencimento,
        OffsetDateTime dataPagamento,
        String descricao,
        String observacao
) {
}
