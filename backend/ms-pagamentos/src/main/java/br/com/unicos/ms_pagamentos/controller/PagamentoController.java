package br.com.unicos.ms_pagamentos.controller;

import br.com.unicos.ms_pagamentos.dto.PagamentoCreateRequest;
import br.com.unicos.ms_pagamentos.dto.PagamentoResponse;
import br.com.unicos.ms_pagamentos.service.PagamentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/pagamentos")
@RequiredArgsConstructor
public class PagamentoController {

    private final PagamentoService pagamentoService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PagamentoResponse criar(@RequestBody @Valid PagamentoCreateRequest request) {
        return pagamentoService.criar(request);
    }

    @PostMapping("/{id}/processar")
    public PagamentoResponse processar(@PathVariable UUID id) {
        return pagamentoService.processar(id);
    }

    @PostMapping("/{id}/estornar")
    public PagamentoResponse estornar(@PathVariable UUID id) {
        return pagamentoService.estornar(id);
    }

    @GetMapping("/{id}")
    public PagamentoResponse buscarPorId(@PathVariable UUID id) {
        return pagamentoService.buscarPorId(id);
    }

    @GetMapping
    public List<PagamentoResponse> listar() {
        return pagamentoService.listar();
    }
}
