package br.com.unicos.ms_pagamentos.service;

import br.com.unicos.ms_pagamentos.dto.pagamento.PagamentoCreateRequest;
import br.com.unicos.ms_pagamentos.dto.pagamento.PagamentoResponse;
import br.com.unicos.ms_pagamentos.dto.pagamento.PagamentoResumoResponse;
import br.com.unicos.ms_pagamentos.dto.pagamento.PagamentoUpdateRequest;
import br.com.unicos.ms_pagamentos.enums.StatusPagamento;
import br.com.unicos.ms_pagamentos.mapper.PagamentoMapper;
import br.com.unicos.ms_pagamentos.model.Pagamento;
import br.com.unicos.ms_pagamentos.repository.PagamentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PagamentoService {

    private final PagamentoRepository pagamentoRepository;
    private final PagamentoMapper pagamentoMapper;

    @Transactional
    public PagamentoResponse criar(PagamentoCreateRequest request) {
        Pagamento pagamento = pagamentoMapper.toEntity(request);
        pagamento.setStatus(StatusPagamento.PENDENTE);
        pagamento.setCodigoTransacao(UUID.randomUUID().toString());
        return pagamentoMapper.toResponse(pagamentoRepository.save(pagamento));
    }

    @Transactional(readOnly = true)
    public PagamentoResponse buscarPorId(Long id) {
        return pagamentoMapper.toResponse(obterOuFalhar(id));
    }

    @Transactional(readOnly = true)
    public Page<PagamentoResumoResponse> listar(Long empresaId, Pageable pageable) {
        if (empresaId == null) {
            return pagamentoRepository.findAll(pageable).map(pagamentoMapper::toResumo);
        }
        return pagamentoRepository.findByEmpresaId(empresaId, pageable).map(pagamentoMapper::toResumo);
    }

    @Transactional
    public PagamentoResponse atualizar(Long id, PagamentoUpdateRequest request) {
        Pagamento pagamento = obterOuFalhar(id);
        pagamento.setValor(request.valor());
        pagamento.setFormaPagamento(request.formaPagamento());
        pagamento.setStatus(request.status());
        pagamento.setDataVencimento(request.dataVencimento());
        pagamento.setDataPagamento(request.dataPagamento());
        pagamento.setDescricao(request.descricao());
        pagamento.setObservacao(request.observacao());
        return pagamentoMapper.toResponse(pagamentoRepository.save(pagamento));
    }

    @Transactional
    public void remover(Long id) {
        Pagamento pagamento = obterOuFalhar(id);
        pagamentoRepository.delete(pagamento);
    }

    private Pagamento obterOuFalhar(Long id) {
        return pagamentoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pagamento não encontrado"));
    }
}
