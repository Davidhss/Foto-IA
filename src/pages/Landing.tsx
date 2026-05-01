import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from './Landing.module.css';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.55 } };

const FEATURES = [
  { icon: '🎯', title: 'Funil de Vendas Visual', desc: 'Acompanhe cada lead desde o primeiro contato até a entrega das fotos. Nunca mais esqueça um cliente em follow-up.' },
  { icon: '🔥', title: 'Meta Diária Gamificada', desc: 'Defina sua meta do dia, acompanhe o faturamento em tempo real e motiva toda a equipe a vender mais com ranking ao vivo.' },
  { icon: '👑', title: 'Ranking da Equipe', desc: 'Ranking de vendas público que cria competição saudável. Saiba quem é o Rei das Vendas do dia e da semana.' },
  { icon: '📁', title: 'Gestão de Arquivos', desc: 'Anexe fotos de referência do cliente e as prévias prontas dentro do próprio perfil do lead. Tudo em um lugar só.' },
  { icon: '💬', title: 'WhatsApp com 1 Clique', desc: 'Acesse o WhatsApp do cliente diretamente do sistema sem copiar e colar número. Mais agilidade no atendimento.' },
  { icon: '📊', title: 'Dashboard Completo', desc: 'Veja o faturamento total, vendas do dia, pedidos pendentes e demonstrações em aberto — tudo em uma tela.' },
  { icon: '✨', title: 'Biblioteca de Prompts IA', desc: 'Tenha acesso a prompts prontos e organizados por categoria para criar fotografias incríveis com IA rapidamente.' },
  { icon: '👥', title: 'Multi-usuário e Equipe', desc: 'Gerencie vendedores e editores com diferentes acessos. Atribua cada lead ao responsável certo.' },
  { icon: '🔁', title: 'Vendas Recorrentes', desc: 'Clientes que compram mais de uma vez? Crie uma nova venda no mesmo cadastro mantendo o histórico organizado.' },
];

const FAQS = [
  { q: 'Funciona para fotógrafo solo ou só para equipes?', a: 'Photo.IA funciona perfeitamente para fotógrafos solo e para equipes de qualquer tamanho. Se você trabalha sozinho, terá controle total das suas vendas e metas. Se tiver uma equipe, poderá ver o ranking, atribuir leads a cada vendedor e acompanhar o desempenho de todos.' },
  { q: 'Preciso instalar algum programa no computador?', a: 'Não. Photo.IA é 100% baseado em nuvem. Basta acessar pelo navegador de qualquer computador, tablet ou celular. Nenhuma instalação, nenhuma atualização manual, nenhuma configuração técnica.' },
  { q: 'Meus dados ficam seguros?', a: 'Sim. Utilizamos a infraestrutura do Supabase (PostgreSQL hospedado em servidores seguros) com autenticação criptografada. Seus dados de clientes e fotos ficam protegidos e acessíveis apenas pela sua equipe.' },
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim, sem nenhuma burocracia. Nos planos Mensal e Trimestral, você pode cancelar quando quiser e o acesso é mantido até o final do período pago. No plano Anual, aplicamos nossa garantia de 7 dias para reembolso integral.' },
  { q: 'Quantos usuários posso cadastrar?', a: 'Não há limite de usuários cadastrados. Você pode adicionar toda a sua equipe de vendedores e editores sem custo adicional por assento, independentemente do plano escolhido.' },
  { q: 'Como funciona a meta diária?', a: 'No início de cada dia, você define a meta de faturamento. O sistema vai acompanhando em tempo real cada venda registrada, exibindo uma barra de progresso com efeito de fogo que fica mais intensa conforme você se aproxima da meta. Quando bate, confete e celebração!' },
  { q: 'Funciona só para fotografia com IA ou para fotografia tradicional também?', a: 'Funciona para qualquer tipo de fotografia! A plataforma é um CRM de gestão de vendas e clientes. A Biblioteca de Prompts é um bônus para quem trabalha com edição e geração por IA, mas o sistema completo serve para estúdios, fotógrafos de evento, produtos, retratos e muito mais.' },
  { q: 'E se eu tiver dúvidas depois de assinar?', a: 'Oferecemos suporte por e-mail em todos os planos. No plano Anual, o suporte é prioritário direto no WhatsApp, garantindo respostas rápidas para que você nunca fique travado.' },
];

const TESTIMONIALS = [
  { name: 'Carlos M.', title: 'Fotógrafo de IA • São Paulo/SP', stars: 5, text: '"Antes eu gerenciava tudo no papel e no WhatsApp. Perdi muitas vendas assim. Com o Photo.IA, sei exatamente em que etapa está cada cliente e minha meta do dia fica na minha cara o tempo todo. Fechei 40% mais em 30 dias."', avatar: '📸' },
  { name: 'Amanda S.', title: 'Gestora de Estúdio • Curitiba/PR', stars: 5, text: '"O ranking da equipe foi uma revolução. Agora meus vendedores chegam animados querendo bater o recorde do dia anterior. É como se fosse um jogo — e o prêmio é real: mais faturamento para todo mundo."', avatar: '👑' },
  { name: 'Rafael T.', title: 'Fotógrafo Solo • Belo Horizonte/MG', stars: 5, text: '"Testei várias planilhas e CRMs genéricos antes. Nada foi feito pensando no nosso dia a dia de fotógrafo. O Photo.IA tem exatamente o que eu preciso, sem complicação. Valeu muito o investimento."', avatar: '🎯' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCheckout = (plan: string) => {
    // Substituir com os links do Stripe quando configurado
    // window.open('https://checkout.stripe.com/...', '_blank');
    console.log('Checkout:', plan);
    navigate('/login');
  };

  return (
    <div className={styles.wrapper}>

      {/* ===== NAVBAR ===== */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📸</span>
          Photo<span className={styles.logoAccent}>.IA</span>
        </div>
        <div className={styles.navLinks}>
          <span className={styles.navLink} onClick={() => scrollTo('features')}>Funcionalidades</span>
          <span className={styles.navLink} onClick={() => scrollTo('how')}>Como funciona</span>
          <span className={styles.navLink} onClick={() => scrollTo('pricing')}>Preços</span>
          <span className={styles.navLink} onClick={() => scrollTo('faq')}>FAQ</span>
        </div>
        <div className={styles.navCta}>
          <button className={styles.btnGhost} onClick={() => navigate('/login')} style={{ padding: '10px 18px', fontSize: '13px' }}>Entrar</button>
          <button className={styles.btnPrimary} onClick={() => scrollTo('pricing')} style={{ padding: '10px 20px', fontSize: '13px' }}>Assinar Agora</button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroGlow2} />
        <motion.div {...fadeUp}>
          <div className={styles.heroPill}>
            <div className={styles.heroPillDot} />
            CRM feito para fotógrafos — lançamento 2025
          </div>
        </motion.div>
        <motion.h1 className={styles.heroTitle} {...fadeUp} transition={{ delay: 0.1, duration: 0.55 }}>
          Chega de perder vendas<br />
          por falta de <span className={styles.heroGrad}>organização</span>
        </motion.h1>
        <motion.p className={styles.heroSub} {...fadeUp} transition={{ delay: 0.2 }}>
          Photo.IA é o único sistema de gestão criado especificamente para fotógrafos e estúdios que trabalham com fotos geradas por IA. Organize leads, bata metas e escale seu faturamento.
        </motion.p>
        <motion.div className={styles.heroCtas} {...fadeUp} transition={{ delay: 0.3 }}>
          <button className={`${styles.btnPrimary} ${styles.btnPrimaryLg}`} onClick={() => scrollTo('pricing')}>
            🚀 Começar por R$ 19,90
          </button>
          <button className={styles.btnGhost} style={{ padding: '16px 28px', fontSize: '16px' }} onClick={() => scrollTo('features')}>
            Ver funcionalidades ↓
          </button>
        </motion.div>
        <motion.div className={styles.heroStats} {...fadeUp} transition={{ delay: 0.4 }}>
          <div style={{ textAlign: 'center' }}>
            <span className={styles.heroStatNum}>+40%</span>
            conversão de vendas
          </div>
          <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <span className={styles.heroStatNum}>0 min</span>
            para configurar
          </div>
          <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <span className={styles.heroStatNum}>100%</span>
            na nuvem
          </div>
        </motion.div>
      </section>

      {/* ===== PAIN SECTION ===== */}
      <section style={{ padding: '80px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <motion.div {...fadeUp} style={{ textAlign: 'center', marginBottom: 50 }}>
          <span className={styles.tag}>Você se identifica?</span>
          <h2 className={styles.h2}>A realidade de quem não tem um sistema</h2>
        </motion.div>
        <div className={styles.painGrid}>
          {[
            { icon: '😤', title: 'Perde clientes por esquecimento', desc: 'Você prometeu fazer follow-up mas o cliente sumiu no WhatsApp e você só lembrou uma semana depois.' },
            { icon: '📋', title: 'Gerencia tudo em planilha', desc: 'Cada linha é um cliente diferente, com status, valor e observação — e qualquer erro estraga tudo.' },
            { icon: '💸', title: 'Não sabe quanto faturou hoje', desc: 'Você tem várias vendas acontecendo mas precisaria somar tudo na mão para saber seu total do dia.' },
            { icon: '😵', title: 'Fotos misturadas por todo lado', desc: 'Referências do cliente no WhatsApp, prévias no Google Drive e o cliente cobrando entrega urgente.' },
          ].map((p, i) => (
            <motion.div key={i} className={styles.painCard} {...fadeUp} transition={{ delay: i * 0.1 }}>
              <div className={styles.painIcon}>{p.icon}</div>
              <div>
                <div className={styles.painTitle}>{p.title}</div>
                <div className={styles.painDesc}>{p.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className={styles.arrowDown}>↓</div>
        <motion.div className={styles.solutionBox} {...fadeUp}>
          <div className={styles.solutionTitle}>📸 Photo.IA resolve tudo isso em menos de 5 minutos</div>
          <p className={styles.solutionDesc}>Um sistema simples, rápido e feito 100% para a realidade do fotógrafo. Basta entrar e cadastrar seu primeiro lead — você já vai ver a diferença.</p>
        </motion.div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className={styles.section}>
        <motion.div {...fadeUp} className={styles.sectionCenter}>
          <span className={styles.tag}>Funcionalidades</span>
          <h2 className={styles.h2}>Tudo que você precisa em <span>um só lugar</span></h2>
          <p className={styles.lead}>Sem integrações complicadas. Sem curva de aprendizado. Só você e suas vendas crescendo.</p>
        </motion.div>
        <div className={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <motion.div key={i} className={styles.featureCard} {...fadeUp} transition={{ delay: (i % 3) * 0.1 }}>
              <div className={styles.fIcon}>{f.icon}</div>
              <h3 className={styles.fTitle}>{f.title}</h3>
              <p className={styles.fDesc}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" style={{ padding: '80px 24px', background: 'rgba(124,58,237,0.03)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <motion.div {...fadeUp} className={styles.sectionCenter} style={{ marginBottom: 60 }}>
            <span className={styles.tag}>Como funciona</span>
            <h2 className={styles.h2}>Simples de usar desde o <span>primeiro dia</span></h2>
          </motion.div>
          <div className={styles.stepsGrid}>
            {[
              { num: '1', title: 'Crie sua conta', desc: 'Cadastre-se em menos de 2 minutos. Sem cartão de crédito para o teste. Acesse instantaneamente.' },
              { num: '2', title: 'Cadastre seus leads', desc: 'Adicione nome, WhatsApp, tipo de serviço e valor. O funil organiza tudo automaticamente.' },
              { num: '3', title: 'Defina sua meta do dia', desc: 'Coloque sua meta de faturamento e acompanhe em tempo real conforme as vendas acontecem.' },
              { num: '4', title: 'Acompanhe e escale', desc: 'Use o dashboard para tomar decisões, ver quem está vendendo mais e onde melhorar.' },
            ].map((s, i) => (
              <motion.div key={i} className={styles.step} {...fadeUp} transition={{ delay: i * 0.12 }}>
                <div className={styles.stepNum}>{s.num}</div>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className={styles.section} id="testimonials">
        <motion.div {...fadeUp} className={styles.sectionCenter}>
          <span className={styles.tag}>Resultados reais</span>
          <h2 className={styles.h2}>O que dizem quem já <span>usa</span></h2>
          <p className={styles.lead}>Fotógrafos reais, resultados reais. Veja o que mudou depois de adotar o Photo.IA.</p>
        </motion.div>
        <div className={styles.testimonialsGrid}>
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={i} className={styles.testimonialCard} {...fadeUp} transition={{ delay: i * 0.1 }}>
              <div className={styles.stars}>{'⭐'.repeat(t.stars)}</div>
              <p className={styles.testimonialText}>{t.text}</p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>{t.avatar}</div>
                <div>
                  <div className={styles.authorName}>{t.name}</div>
                  <div className={styles.authorTitle}>{t.title}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <div id="pricing" className={styles.pricingBg}>
        <div className={styles.pricingWrap}>
          <motion.div {...fadeUp} className={styles.sectionCenter}>
            <span className={styles.tag}>Planos e Preços</span>
            <h2 className={styles.h2}>Invista menos que um lanche<br />e multiplique seu <span>faturamento</span></h2>
            <p className={styles.lead}>Sem taxas escondidas. Cancele quando quiser. Acesso completo em todos os planos.</p>
          </motion.div>
          <div className={styles.pricingGrid}>

            {/* MENSAL */}
            <motion.div className={styles.priceCard} {...fadeUp}>
              <div className={styles.planPeriod}>Mensal</div>
              <div className={styles.planName}>Plano Básico</div>
              <div className={styles.planSubtitle}>Para começar e testar</div>
              <div className={styles.planPrice}>R$ 19<sub>,90/mês</sub></div>
              <div className={styles.planPriceNote}>Cobrado mensalmente</div>
              <div className={styles.planDivider} />
              <ul className={styles.planFeatures}>
                {['Leads ilimitados', 'Funil de vendas completo', 'Gestão de fotos por lead', 'Dashboard de métricas', 'Biblioteca de prompts IA', 'Suporte por e-mail'].map(f => (
                  <li key={f}><span className={styles.checkIcon}>✓</span>{f}</li>
                ))}
              </ul>
              <button className={`${styles.btnCheckout} ${styles.btnCheckoutGhost}`} onClick={() => handleCheckout('mensal')}>Assinar Mensal</button>
            </motion.div>

            {/* TRIMESTRAL */}
            <motion.div className={`${styles.priceCard} ${styles.featured}`} {...fadeUp} transition={{ delay: 0.1 }}>
              <div className={styles.featuredGlow} />
              <div className={styles.popularTag}>Mais popular</div>
              <div className={styles.planPeriod}>Trimestral</div>
              <div className={styles.planName}>Plano Pro</div>
              <div className={styles.planSubtitle}>Para quem quer crescer</div>
              <div className={styles.planPrice}>R$ 49<sub>,90/tri</sub></div>
              <div className={styles.planPriceNote}>Equivale a R$ 16,63/mês</div>
              <div className={styles.planEconomy}>💰 Economia de R$ 10 vs mensal</div>
              <div className={styles.planDivider} />
              <ul className={styles.planFeatures}>
                {['Tudo do plano Mensal', 'Meta diária gamificada', 'Ranking da equipe ao vivo', 'Múltiplos usuários', 'Vendas recorrentes por lead', 'Acesso antecipado a novidades'].map(f => (
                  <li key={f}><span className={styles.checkIcon}>✓</span>{f}</li>
                ))}
              </ul>
              <button className={`${styles.btnCheckout} ${styles.btnCheckoutPrimary}`} onClick={() => handleCheckout('trimestral')}>🚀 Assinar Trimestral</button>
            </motion.div>

            {/* ANUAL */}
            <motion.div className={styles.priceCard} {...fadeUp} transition={{ delay: 0.2 }}>
              <div className={styles.planPeriod}>Anual</div>
              <div className={styles.planName}>Plano Elite</div>
              <div className={styles.planSubtitle}>Para profissionais sérios</div>
              <div className={styles.planPrice}>R$ 179<sub>,90/ano</sub></div>
              <div className={styles.planPriceNote}>Equivale a R$ 14,99/mês</div>
              <div className={styles.planEconomy}>🎁 2 meses grátis vs mensal</div>
              <div className={styles.planDivider} />
              <ul className={styles.planFeatures}>
                {['Tudo do plano Pro', 'Suporte prioritário no WhatsApp', 'Relatórios avançados (em breve)', 'Garantia de 7 dias ou reembolso', 'Preço travado por 1 ano', 'Badge Elite exclusivo no perfil'].map(f => (
                  <li key={f}><span className={styles.checkIcon}>✓</span>{f}</li>
                ))}
              </ul>
              <button className={`${styles.btnCheckout} ${styles.btnCheckoutGhost}`} onClick={() => handleCheckout('anual')}>Assinar Anual</button>
            </motion.div>

          </div>
        </div>
      </div>

      {/* ===== GUARANTEE ===== */}
      <section className={styles.section} style={{ textAlign: 'center' }}>
        <motion.div className={styles.guaranteeBox} {...fadeUp}>
          <span className={styles.guaranteeIcon}>🛡️</span>
          <h2 className={styles.guaranteeTitle}>Garantia incondicional de 7 dias</h2>
          <p className={styles.guaranteeDesc}>
            No plano Anual, se você não ficar satisfeito por qualquer motivo nos primeiros 7 dias, devolvemos 100% do seu dinheiro — sem burocracia, sem perguntas. Risco zero para você.
          </p>
        </motion.div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className={styles.section}>
        <motion.div {...fadeUp} className={styles.sectionCenter}>
          <span className={styles.tag}>Dúvidas frequentes</span>
          <h2 className={styles.h2}>Respondendo tudo antes<br />de você <span>perguntar</span></h2>
        </motion.div>
        <div className={styles.faqList}>
          {FAQS.map((f, i) => (
            <motion.div key={i} className={styles.faqItem} {...fadeUp} transition={{ delay: i * 0.06 }}>
              <button className={styles.faqQuestion} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {f.q}
                <span className={`${styles.faqIcon} ${openFaq === i ? styles.open : ''}`}>+</span>
              </button>
              <div className={`${styles.faqAnswer} ${openFaq === i ? styles.open : ''}`}>{f.a}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBg} />
        <motion.div {...fadeUp}>
          <h2 className={styles.ctaTitle}>Pronto para <span>decolar</span>?</h2>
          <p className={styles.ctaSub}>Comece hoje por menos de um café por dia. Sem contrato longo. Sem risco.</p>
          <button className={`${styles.btnPrimary} ${styles.btnPrimaryLg}`} onClick={() => scrollTo('pricing')}>
            🚀 Quero assinar agora
          </button>
          <p className={styles.ctaNote}>✓ Acesso imediato &nbsp;·&nbsp; ✓ Cancele quando quiser &nbsp;·&nbsp; ✓ Suporte incluído</p>
        </motion.div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className={styles.footer}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📸</span>
          Photo<span className={styles.logoAccent}>.IA</span>
          <span className={styles.footerCopy} style={{ marginLeft: 16 }}>© {new Date().getFullYear()} Todos os direitos reservados.</span>
        </div>
        <div className={styles.footerLinks}>
          <span className={styles.footerLink} onClick={() => scrollTo('features')}>Funcionalidades</span>
          <span className={styles.footerLink} onClick={() => scrollTo('pricing')}>Preços</span>
          <span className={styles.footerLink} onClick={() => scrollTo('faq')}>FAQ</span>
          <span className={styles.footerLink} onClick={() => navigate('/login')}>Entrar</span>
        </div>
      </footer>

    </div>
  );
}
