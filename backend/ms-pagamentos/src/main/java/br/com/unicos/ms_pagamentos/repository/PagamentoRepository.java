package br.com.unicos.ms_pagamentos.repository;

import br.com.unicos.ms_pagamentos.model.Pagamento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {
    Page<Pagamento> findByEmpresaId(Long empresaId, Pageable pageable);
}
