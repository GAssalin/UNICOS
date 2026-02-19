package br.com.unicos.ms_pagamentos.repository;

import br.com.unicos.ms_pagamentos.model.Pagamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PagamentoRepository extends JpaRepository<Pagamento, UUID> {
}
