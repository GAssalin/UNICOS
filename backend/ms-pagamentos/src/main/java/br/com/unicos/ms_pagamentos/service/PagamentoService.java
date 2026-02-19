package br.com.unicos.ms_pagamentos.service;

import br.com.unicos.ms_pagamentos.dto.PagamentoCreateRequest;
import br.com.unicos.ms_pagamentos.dto.PagamentoResponse;
import br.com.unicos.ms_pagamentos.model.Pagamento;
import br.com.unicos.ms_pagamentos.model.StatusPagamento;
import br.com.unicos.ms_pagamentos.repository.PagamentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PagamentoService {

    private final SimuladorGatewayPagamento gatewayPagamento;
    private final PagamentoRepository pagamentoRepository;

    @Transactional
    public PagamentoResponse criar(PagamentoCreateRequest request) {
        Pagamento pagamento = Pagamento.builder()
                .referenciaPedido(request.getReferenciaPedido())
                .valor(request.getValor())
                .moeda(request.getMoeda())
                .metodo(request.getMetodo())
                .numeroCartao(request.getNumeroCartao())
                .chavePix(request.getChavePix())
                .status(StatusPagamento.CRIADO)
                .build();

        Pagamento salvo = pagamentoRepository.save(pagamento);
        return toResponse(salvo);
    }

    @Transactional
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

        ProcessamentoGatewayResponse retorno = gatewayPagamento.processar(toGatewayRequest(pagamento));

        if (retorno.isAprovado()) {
            pagamento.setStatus(StatusPagamento.APROVADO);
            pagamento.setDescricaoRecusa(null);
            pagamento.setCodigoAutorizacao(retorno.getCodigoAutorizacao());
            pagamento.setNsu(retorno.getNsu());
        } else {
            pagamento.setStatus(StatusPagamento.RECUSADO);
            pagamento.setDescricaoRecusa(retorno.getDescricao());
        }

        return toResponse(pagamentoRepository.save(pagamento));
    }

    @Transactional
    public PagamentoResponse estornar(UUID pagamentoId) {
        Pagamento pagamento = getPagamento(pagamentoId);

        if (pagamento.getStatus() != StatusPagamento.APROVADO) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Somente pagamentos aprovados podem ser estornados.");
        }

        pagamento.setStatus(StatusPagamento.ESTORNADO);
        return toResponse(pagamentoRepository.save(pagamento));
    }

    @Transactional(readOnly = true)
    public PagamentoResponse buscarPorId(UUID id) {
        return toResponse(getPagamento(id));
    }

    @Transactional(readOnly = true)
    public List<PagamentoResponse> listar() {
        return pagamentoRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    private Pagamento getPagamento(UUID id) {
        return pagamentoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pagamento não encontrado."));
    }

    private PagamentoCreateRequest toGatewayRequest(Pagamento pagamento) {
        PagamentoCreateRequest request = new PagamentoCreateRequest();
        request.setReferenciaPedido(pagamento.getReferenciaPedido());
        request.setValor(pagamento.getValor());
        request.setMoeda(pagamento.getMoeda());
        request.setMetodo(pagamento.getMetodo());
        request.setNumeroCartao(pagamento.getNumeroCartao());
        request.setChavePix(pagamento.getChavePix());
        return request;
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
