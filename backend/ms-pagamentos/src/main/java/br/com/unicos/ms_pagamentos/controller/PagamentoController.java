package br.com.unicos.ms_pagamentos.controller;

import br.com.unicos.ms_pagamentos.dto.pagamento.PagamentoCreateRequest;
import br.com.unicos.ms_pagamentos.dto.pagamento.PagamentoResponse;
import br.com.unicos.ms_pagamentos.dto.pagamento.PagamentoResumoResponse;
import br.com.unicos.ms_pagamentos.dto.pagamento.PagamentoUpdateRequest;
import br.com.unicos.ms_pagamentos.service.PagamentoService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/pagamentos")
@RequiredArgsConstructor
@Tag(name = "Pagamentos", description = "Gestão de pagamentos, liquidações e transações financeiras")
public class PagamentoController {

    private final PagamentoService pagamentoService;

    @PostMapping
    public ResponseEntity<PagamentoResponse> criar(@RequestBody @Valid PagamentoCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pagamentoService.criar(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PagamentoResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(pagamentoService.buscarPorId(id));
    }

    @GetMapping
    public ResponseEntity<Page<PagamentoResumoResponse>> listar(
            @RequestParam(required = false) Long empresaId,
            @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(pagamentoService.listar(empresaId, pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PagamentoResponse> atualizar(
            @PathVariable Long id,
            @RequestBody @Valid PagamentoUpdateRequest request
    ) {
        return ResponseEntity.ok(pagamentoService.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        pagamentoService.remover(id);
        return ResponseEntity.noContent().build();
    }
}
