/*
 * Amostra curada e não exaustiva de tratamentos/medicamentos e seu status
 * no Rol de Procedimentos e Eventos em Saúde da ANS (RN 465/2021 e
 * atualizações posteriores), com base em fontes públicas (Lei 9.656/98,
 * Lei 12.880/2013, Lei 14.454/2022, atualizações do rol divulgadas pela
 * ANS até jul/2026).
 *
 * NÃO é uma base oficial nem espelha o rol completo (que tem milhares de
 * itens). Cobertura real depende sempre do tipo de plano contratado, de
 * diretrizes de utilização (DUT) e de avaliação médica — em caso de
 * dúvida ou negativa, confirme na ferramenta oficial da ANS ou consulte a
 * operadora/um advogado especializado.
 */
window.ROL_ANS_DATA = [
  { nome: "Terapia ABA (Análise do Comportamento Aplicada) para TEA", aliases: ["aba", "autismo", "tea"], categoria: "Terapias multidisciplinares", status: "coberto", nota: "Sessões ilimitadas conforme indicação médica, sem limite de quantidade por ano (Lei 14.454/2022)." },
  { nome: "Fonoaudiologia para TEA ou atraso de desenvolvimento", aliases: ["fono", "fonoaudiologo", "autismo"], categoria: "Terapias multidisciplinares", status: "coberto", nota: "Sem limite de sessões quando há indicação médica (Lei 14.454/2022)." },
  { nome: "Terapia ocupacional", aliases: ["to", "terapeuta ocupacional"], categoria: "Terapias multidisciplinares", status: "coberto", nota: "Sem limite de sessões com indicação médica, inclusive para TEA." },
  { nome: "Psicoterapia / psicologia", aliases: ["psicólogo", "terapia", "saúde mental"], categoria: "Saúde mental", status: "coberto", nota: "Sem limite anual de sessões desde 2022; pode exigir relatório médico para autorização." },
  { nome: "Psicomotricidade", aliases: ["psicomotor"], categoria: "Terapias multidisciplinares", status: "coberto", nota: "Coberto quando prescrita para TEA ou atraso de desenvolvimento." },
  { nome: "Cirurgia bariátrica (gastroplastia)", aliases: ["bariátrica", "redução de estômago", "obesidade cirurgia"], categoria: "Obesidade", status: "coberto_condicional", nota: "Exige critérios de IMC, comorbidades e 2 anos de tratamento clínico prévio malsucedido, conforme DUT." },
  { nome: "Acompanhamento nutricional pós-bariátrica", aliases: ["nutricionista pós bariátrica"], categoria: "Obesidade", status: "coberto", nota: "Número de sessões definido em DUT específica." },
  { nome: "Medicamento para emagrecimento de uso domiciliar (ex.: análogos de GLP-1)", aliases: ["caneta emagrecedora", "semaglutida", "liraglutida", "ozempic", "saxenda"], categoria: "Obesidade", status: "nao_coberto", nota: "Medicamento de uso domiciliar para obesidade, em geral, não é item de cobertura obrigatória do rol." },
  { nome: "Quimioterapia oral antineoplásica", aliases: ["quimioterapia oral", "câncer remédio oral", "antineoplásico oral"], categoria: "Oncologia", status: "coberto", nota: "Lei 12.880/2013 tornou obrigatória a cobertura de medicamentos antineoplásicos orais registrados na Anvisa e listados no rol." },
  { nome: "Quimioterapia intravenosa hospitalar", aliases: ["quimioterapia", "quimio venosa"], categoria: "Oncologia", status: "coberto", nota: "Procedimento hospitalar padrão de cobertura obrigatória." },
  { nome: "Radioterapia com técnica IMRT", aliases: ["radioterapia", "imrt"], categoria: "Oncologia", status: "coberto_condicional", nota: "Incorporada ao rol em atualizações recentes, sujeita a DUT por tipo de tumor." },
  { nome: "PET-CT (tomografia por emissão de pósitrons)", aliases: ["pet ct", "pet scan"], categoria: "Diagnóstico", status: "coberto_condicional", nota: "Cobertura obrigatória com DUT específica por tipo de câncer e finalidade." },
  { nome: "Medicamento imunobiológico domiciliar (ex.: para artrite reumatoide, psoríase)", aliases: ["biológico", "adalimumabe", "etanercepte", "imunobiológico"], categoria: "Doenças autoimunes", status: "coberto_condicional", nota: "Cobertura domiciliar obrigatória quando preenchidos os critérios de DUT (geralmente falha a tratamento convencional)." },
  { nome: "Home care / internação domiciliar", aliases: ["home care", "internação em casa"], categoria: "Internação", status: "controverso", nota: "Não é item padrão obrigatório do rol; depende do contrato com a operadora, embora existam decisões judiciais favoráveis em casos específicos." },
  { nome: "Fertilização in vitro (FIV) e inseminação artificial", aliases: ["fiv", "reprodução assistida", "inseminação artificial"], categoria: "Reprodução", status: "nao_coberto", nota: "Excluído expressamente da cobertura obrigatória pelo art. 10, III da Lei 9.656/98." },
  { nome: "Investigação diagnóstica de infertilidade", aliases: ["exames de infertilidade"], categoria: "Reprodução", status: "coberto", nota: "Consultas e exames diagnósticos são cobertos; o procedimento de fertilização em si não é." },
  { nome: "Cirurgia refrativa a laser (miopia/astigmatismo)", aliases: ["lasik", "cirurgia de miopia", "cirurgia refrativa"], categoria: "Oftalmologia", status: "coberto_condicional", nota: "Coberta apenas em graus elevados com indicação específica prevista em DUT; fora disso é considerada eletiva." },
  { nome: "Transplante de órgãos (rim, fígado, coração, medula óssea)", aliases: ["transplante"], categoria: "Transplantes", status: "coberto_condicional", nota: "Coberto em planos com segmentação hospitalar, condicionado a DUT e fila do sistema de captação." },
  { nome: "CPAP para apneia do sono", aliases: ["cpap", "apneia"], categoria: "Equipamentos", status: "coberto_condicional", nota: "Locação/uso coberto mediante polissonografia comprobatória e indicação médica." },
  { nome: "Polissonografia", aliases: ["exame do sono"], categoria: "Diagnóstico", status: "coberto", nota: "Exame de cobertura obrigatória com indicação médica." },
  { nome: "Vacinas fora de contexto de urgência/internação", aliases: ["vacina", "hpv vacina", "febre amarela vacina"], categoria: "Prevenção", status: "nao_coberto", nota: "Vacinas, em geral, não integram o rol assistencial padrão dos planos médicos." },
  { nome: "Tratamento odontológico", aliases: ["dentista", "odontologia"], categoria: "Odontologia", status: "nao_coberto", nota: "Não coberto por plano médico comum; requer plano odontológico específico." },
  { nome: "Cirurgia reparadora pós-bariátrica (retirada de excesso de pele)", aliases: ["dermolipectomia", "retirada de pele excedente"], categoria: "Cirurgia", status: "coberto_condicional", nota: "Coberta quando comprovadamente reparadora/funcional (não estética), com laudo médico." },
  { nome: "Cirurgia plástica estética (sem indicação funcional)", aliases: ["plástica estética"], categoria: "Cirurgia", status: "nao_coberto", nota: "Procedimentos puramente estéticos, sem indicação funcional/reparadora, não são cobertos." },
  { nome: "Teste genético BRCA1/BRCA2", aliases: ["brca", "teste genético câncer de mama"], categoria: "Diagnóstico", status: "coberto_condicional", nota: "Coberto com DUT específica, geralmente vinculada a histórico familiar de câncer de mama/ovário." },
  { nome: "Painel genético amplo / sequenciamento sem indicação específica", aliases: ["sequenciamento genético", "exame genético amplo"], categoria: "Diagnóstico", status: "nao_coberto", nota: "Testes genéticos amplos fora dos critérios de DUT não têm cobertura obrigatória garantida." },
  { nome: "Acupuntura", aliases: ["acupuntura"], categoria: "Terapias", status: "coberto_condicional", nota: "Incluída no rol, com número de sessões conforme DUT." },
  { nome: "Pilates terapêutico", aliases: ["pilates"], categoria: "Terapias", status: "nao_coberto", nota: "Geralmente tratado como atividade física, não como procedimento médico coberto — mesmo com fins terapêuticos." },
  { nome: "Fisioterapia motora ou respiratória", aliases: ["fisioterapia", "fisio"], categoria: "Terapias", status: "coberto", nota: "Sem limite de sessões desde 2022, conforme indicação médica." },
  { nome: "Tratamento com canabidiol (CBD)", aliases: ["cbd", "canabidiol", "cannabis medicinal"], categoria: "Medicamentos", status: "nao_coberto", nota: "Não incluído no rol; cobertura costuma ser discutida judicialmente caso a caso." },
  { nome: "Internação para tratamento de dependência química", aliases: ["clínica de reabilitação", "dependência química"], categoria: "Saúde mental", status: "coberto_condicional", nota: "Coberta em planos com segmentação hospitalar psiquiátrica, com limites de dias/ano previstos na regulamentação." },
  { nome: "Hormonioterapia para transição de gênero", aliases: ["hormonioterapia", "transição de gênero"], categoria: "Endocrinologia", status: "coberto_condicional", nota: "Coberta quando há indicação médica documentada; consulte a operadora sobre exigências específicas." },
  { nome: "Cirurgia de redesignação sexual", aliases: ["cirurgia de redesignação sexual", "transgenitalização"], categoria: "Cirurgia", status: "controverso", nota: "Disponível no SUS; em planos privados a obrigatoriedade é mais debatida e pode depender de decisão judicial." },
  { nome: "Toxina botulínica para bruxismo ou enxaqueca crônica", aliases: ["botox terapêutico", "toxina botulínica"], categoria: "Neurologia", status: "coberto_condicional", nota: "Coberta com DUT específica para fins terapêuticos — não para fins estéticos." },
  { nome: "Aplicação de botox estético", aliases: ["botox estético"], categoria: "Estética", status: "nao_coberto", nota: "Procedimento estético, sem indicação terapêutica, não é coberto." },
  { nome: "Consulta com nutricionista", aliases: ["nutricionista"], categoria: "Consultas", status: "coberto", nota: "Rol prevê número mínimo de consultas por ano, independentemente do contexto." },
  { nome: "Fonoaudiologia para reabilitação pós-AVC (afasia)", aliases: ["afasia", "reabilitação avc"], categoria: "Reabilitação", status: "coberto", nota: "Coberta como parte do tratamento de reabilitação pós-AVC." },
  { nome: "Órteses e próteses ligadas a cirurgia coberta (ex.: marca-passo, stent)", aliases: ["opme", "prótese", "órtese", "stent", "marca-passo"], categoria: "Materiais", status: "coberto", nota: "Cobertos quando vinculados a um ato cirúrgico que já é de cobertura obrigatória." },
  { nome: "Óculos de grau ou lentes de contato", aliases: ["óculos", "lentes de contato"], categoria: "Materiais", status: "nao_coberto", nota: "Não são procedimento médico; são considerados bem de consumo, fora do rol." },
  { nome: "Aparelho auditivo", aliases: ["aparelho de audição", "prótese auditiva"], categoria: "Materiais", status: "coberto_condicional", nota: "Cobertura depende do grau de perda auditiva e de DUT específica — confirme com a operadora." },
  { nome: "Massagem relaxante / terapias de bem-estar (SPA)", aliases: ["spa", "massagem relaxante"], categoria: "Estética", status: "nao_coberto", nota: "Terapias de bem-estar sem finalidade médica comprovada não são cobertas." },
  { nome: "Terapia com células CAR-T para linfomas elegíveis", aliases: ["car-t", "terapia gênica câncer"], categoria: "Oncologia", status: "coberto_condicional", nota: "Incorporada em atualizações recentes do rol para indicações elegíveis, com DUT de alto custo." },
  { nome: "Cirurgia bariátrica em adolescentes", aliases: ["bariátrica adolescente"], categoria: "Obesidade", status: "coberto_condicional", nota: "Coberta sob critérios rígidos de idade, maturidade óssea e comorbidades, conforme DUT." },
];
