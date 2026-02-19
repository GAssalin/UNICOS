package br.com.unicos.ms_pagamentos.service;

import br.com.unicos.ms_pagamentos.dto.PagamentoCreateRequest;
import br.com.unicos.ms_pagamentos.dto.PagamentoResponse;
import br.com.unicos.ms_pagamentos.model.Pagamento;
import br.com.unicos.ms_pagamentos.model.StatusPagamento;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class PagamentoService {

    private final SimuladorGatewayPagamento gatewayPagamento;
    private final ConcurrentHashMap<UUID, Pagamento> pagamentos = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, PagamentoCreateRequest> requisicoes = new ConcurrentHashMap<>();

    public PagamentoResponse criar(PagamentoCreateRequest request) {
        UUID id = UUID.randomUUID();
        OffsetDateTime agora = OffsetDateTime.now();

        Pagamento pagamento = Pagamento.builder()
                .id(id)
                .referenciaPedido(request.getReferenciaPedido())
                .valor(request.getValor())
                .moeda(request.getMoeda())
                .metodo(request.getMetodo())
                .status(StatusPagamento.CRIADO)
                .criadoEm(agora)
                .atualizadoEm(agora)
                .build();

        pagamentos.put(id, pagamento);
        requisicoes.put(id, request);

        return toResponse(pagamento);
    }

    public PagamentoResponse processar(UUID pagamentoId) {
        Pagamento pagamento = getPagamento(pagamentoId);

        if (pagamento.getStatus() == StatusPagamento.APROVADO) {
            return toResponse(pagamento);
        }

        if (pagamento.getStatus() == StatusPagamento.ESTORNADO) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Pagamento estornado não pode ser reprocessado.");
        }

        pagamento.setStatus(StatusPagamento.PROCESSANDO);
        pagamento.setAtualizadoEm(OffsetDateTime.now());

        ProcessamentoGatewayResponse retorno = gatewayPagamento.processar(requisicoes.get(pagamentoId));

        if (retorno.isAprovado()) {
            pagamento.setStatus(StatusPagamento.APROVADO);
            pagamento.setDescricaoRecusa(null);
            pagamento.setCodigoAutorizacao(retorno.getCodigoAutorizacao());
            pagamento.setNsu(retorno.getNsu());
        } else {
            pagamento.setStatus(StatusPagamento.RECUSADO);
            pagamento.setDescricaoRecusa(retorno.getDescricao());
        }

        pagamento.setAtualizadoEm(OffsetDateTime.now());
        return toResponse(pagamento);
    }

    public PagamentoResponse estornar(UUID pagamentoId) {
        Pagamento pagamento = getPagamento(pagamentoId);

        if (pagamento.getStatus() != StatusPagamento.APROVADO) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Somente pagamentos aprovados podem ser estornados.");
        }

        pagamento.setStatus(StatusPagamento.ESTORNADO);
        pagamento.setAtualizadoEm(OffsetDateTime.now());
        return toResponse(pagamento);
    }

    public PagamentoResponse buscarPorId(UUID id) {
        return toResponse(getPagamento(id));
    }

    public List<PagamentoResponse> listar() {
        return pagamentos.values().stream()
                .map(this::toResponse)
                .toList();
    }

    private Pagamento getPagamento(UUID id) {
        Pagamento pagamento = pagamentos.get(id);
        if (pagamento == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pagamento não encontrado.");
        }
        return pagamento;
    }

    private PagamentoResponse toResponse(Pagamento pagamento) {
        return PagamentoResponse.builder()
                .id(pagamento.getId())
                .referenciaPedido(pagamento.getReferenciaPedido())
                .valor(pagamento.getValor())
                .moeda(pagamento.getMoeda())
                .metodo(pagamento.getMetodo())
                .status(pagamento.getStatus())
                .descricaoRecusa(pagamento.getDescricaoRecusa())
                .codigoAutorizacao(pagamento.getCodigoAutorizacao())
                .nsu(pagamento.getNsu())
                .criadoEm(pagamento.getCriadoEm())
                .atualizadoEm(pagamento.getAtualizadoEm())
                .build();
    }
}
