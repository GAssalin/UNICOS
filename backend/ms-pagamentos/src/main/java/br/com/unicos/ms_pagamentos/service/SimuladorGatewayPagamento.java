package br.com.unicos.ms_pagamentos.service;

import br.com.unicos.ms_pagamentos.dto.PagamentoCreateRequest;
import br.com.unicos.ms_pagamentos.model.MetodoPagamento;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Component
public class SimuladorGatewayPagamento {

    public ProcessamentoGatewayResponse processar(PagamentoCreateRequest request) {
        if (request.getMetodo() == MetodoPagamento.PIX && (request.getChavePix() == null || request.getChavePix().isBlank())) {
            return recusado("Chave PIX obrigatória para pagamentos via PIX.");
        }

        if (request.getMetodo() == MetodoPagamento.CARTAO_CREDITO && !isLuhnValido(request.getNumeroCartao())) {
            return recusado("Número de cartão inválido.");
        }

        if (request.getValor().compareTo(new BigDecimal("10000.00")) > 0) {
            return recusado("Pagamento recusado por política antifraude (valor acima do limite). ");
        }

        return ProcessamentoGatewayResponse.builder()
                .aprovado(true)
                .descricao("Pagamento aprovado pelo adquirente.")
                .codigoAutorizacao("AUT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .nsu("NSU-" + Instant.now().toEpochMilli())
                .build();
    }

    private boolean isLuhnValido(String numeroCartao) {
        if (numeroCartao == null) {
            return false;
        }

        String digitos = numeroCartao.replaceAll("\\s", "");
        if (!digitos.matches("\\d{13,19}")) {
            return false;
        }

        int soma = 0;
        boolean duplicar = false;

        for (int i = digitos.length() - 1; i >= 0; i--) {
            int n = Character.getNumericValue(digitos.charAt(i));
            if (duplicar) {
                n *= 2;
                if (n > 9) {
                    n -= 9;
                }
            }
            soma += n;
            duplicar = !duplicar;
        }

        return soma % 10 == 0;
    }

    private ProcessamentoGatewayResponse recusado(String descricao) {
        return ProcessamentoGatewayResponse.builder()
                .aprovado(false)
                .descricao(descricao)
                .build();
    }
}
