package br.com.unicos.ms_pagamentos.mapper;

import br.com.unicos.ms_pagamentos.dto.pagamento.PagamentoCreateRequest;
import br.com.unicos.ms_pagamentos.dto.pagamento.PagamentoResponse;
import br.com.unicos.ms_pagamentos.dto.pagamento.PagamentoResumoResponse;
import br.com.unicos.ms_pagamentos.model.Pagamento;
import org.springframework.stereotype.Component;

@Component
public class PagamentoMapper {

    public Pagamento toEntity(PagamentoCreateRequest request) {
        return Pagamento.builder()
                .empresaId(request.empresaId())
                .vendaId(request.vendaId())
                .compraId(request.compraId())
                .valor(request.valor())
                .formaPagamento(request.formaPagamento())
                .dataVencimento(request.dataVencimento())
                .descricao(request.descricao())
                .observacao(request.observacao())
                .build();
    }

    public PagamentoResponse toResponse(Pagamento pagamento) {
        return new PagamentoResponse(
                pagamento.getId(),
                pagamento.getEmpresaId(),
                pagamento.getVendaId(),
                pagamento.getCompraId(),
                pagamento.getValor(),
                pagamento.getFormaPagamento(),
                pagamento.getStatus(),
                pagamento.getCodigoTransacao(),
                pagamento.getDataVencimento(),
                pagamento.getDataPagamento(),
                pagamento.getDescricao(),
                pagamento.getObservacao()
        );
    }

    public PagamentoResumoResponse toResumo(Pagamento pagamento) {
        return new PagamentoResumoResponse(
                pagamento.getId(),
                pagamento.getEmpresaId(),
                pagamento.getValor(),
                pagamento.getStatus()
        );
    }
}
