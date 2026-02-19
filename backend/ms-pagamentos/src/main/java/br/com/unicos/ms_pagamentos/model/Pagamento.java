package br.com.unicos.ms_pagamentos.model;

import br.com.unicos.core.tenant.model.BaseTenantEntity;
import br.com.unicos.ms_pagamentos.enums.FormaPagamento;
import br.com.unicos.ms_pagamentos.enums.StatusPagamento;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "pagamento")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Pagamento extends BaseTenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;

    @Column(name = "venda_id")
    private Long vendaId;

    @Column(name = "compra_id")
    private Long compraId;

    @NotNull
    @DecimalMin(value = "0.01")
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal valor;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FormaPagamento formaPagamento;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusPagamento status;

    @Column(name = "codigo_transacao", length = 100)
    private String codigoTransacao;

    @Column(name = "data_vencimento")
    private LocalDate dataVencimento;

    @Column(name = "data_pagamento")
    private OffsetDateTime dataPagamento;

    @Column(length = 500)
    private String descricao;

    @Column(length = 500)
    private String observacao;
}
