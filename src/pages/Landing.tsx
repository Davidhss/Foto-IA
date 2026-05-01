import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from './Landing.module.css';

export default function Landing() {
  const navigate = useNavigate();

  const handleCheckout = (plan: string) => {
    // Aqui será conectada a URL de checkout do Stripe futuramente
    console.log('Checkout:', plan);
    // Para efeito de demonstração, caso o usuário apenas queira logar:
    navigate('/login');
  };

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span>📸</span> Foto IA
        </div>
        <div className={styles.headerActions}>
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>Entrar</button>
          <button className="btn btn-primary" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
            Ver Planos
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.badge}>Novo ✨ Plataforma de Gestão 2.0</div>
          <h1 className={styles.title}>
            Escale suas vendas de fotografia com <span>Inteligência</span>
          </h1>
          <p className={styles.subtitle}>
            Organize seus clientes, gerencie fotos entregues e escale seus lucros diários com a única ferramenta desenhada exclusivamente para fotógrafos.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn btn-primary btn-lg" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
              Começar Agora
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/login')}>
              Já tenho uma conta
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featuresGrid}>
          <motion.div className={styles.featureCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className={styles.fIcon}>🎯</div>
            <h3 className={styles.fTitle}>Funil de Vendas Visual</h3>
            <p className={styles.fDesc}>Acompanhe cada cliente desde o primeiro contato até a entrega final das fotos, sem perder nenhuma oportunidade.</p>
          </motion.div>
          <motion.div className={styles.featureCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <div className={styles.fIcon}>🔥</div>
            <h3 className={styles.fTitle}>Metas Diárias</h3>
            <p className={styles.fDesc}>Defina e bata suas metas todos os dias com um dashboard gamificado que motiva sua equipe a vender mais.</p>
          </motion.div>
          <motion.div className={styles.featureCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <div className={styles.fIcon}>📁</div>
            <h3 className={styles.fTitle}>Gestão de Arquivos</h3>
            <p className={styles.fDesc}>Anexe fotos de referência e as prévias diretamente no perfil de cada lead, centralizando a operação.</p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={styles.pricing}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className={styles.sectionTitle}>Planos Simples e Transparentes</h2>
          <p className={styles.sectionSub}>Escolha o melhor plano para escalar seu negócio fotográfico.</p>
        </motion.div>

        <div className={styles.pricingGrid}>
          {/* Mensal */}
          <motion.div className={styles.priceCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h3 className={styles.planName}>Mensal</h3>
            <div className={styles.planPrice}>R$ 19,90<span>/mês</span></div>
            <p className={styles.planDesc}>Ideal para começar a organizar sua operação e gerenciar vendas ativamente.</p>
            <ul className={styles.planFeatures}>
              <li><span className={styles.check}>✓</span> Leads ilimitados</li>
              <li><span className={styles.check}>✓</span> Funil de vendas completo</li>
              <li><span className={styles.check}>✓</span> Gestão de fotos</li>
              <li><span className={styles.check}>✓</span> Suporte via email</li>
            </ul>
            <button className={`${styles.btnCheckout} ${styles.secondary}`} onClick={() => handleCheckout('mensal')}>
              Assinar Mensal
            </button>
          </motion.div>

          {/* Trimestral (Featured) */}
          <motion.div className={`${styles.priceCard} ${styles.featured}`} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1.02 }} viewport={{ once: true }}>
            <div className={styles.popularBadge}>Mais Popular</div>
            <h3 className={styles.planName}>Trimestral</h3>
            <div className={styles.planPrice}>R$ 49,90<span>/tri</span></div>
            <p className={styles.planDesc}>O equilíbrio perfeito para quem quer crescer com constância pagando menos.</p>
            <ul className={styles.planFeatures}>
              <li><span className={styles.check}>✓</span> Tudo do plano mensal</li>
              <li><span className={styles.check}>✓</span> Economia de 16%</li>
              <li><span className={styles.check}>✓</span> Dashboard avançado de Metas</li>
              <li><span className={styles.check}>✓</span> Multi-usuário (Equipe)</li>
            </ul>
            <button className={`${styles.btnCheckout} ${styles.primary}`} onClick={() => handleCheckout('trimestral')}>
              Assinar Trimestral
            </button>
          </motion.div>

          {/* Anual */}
          <motion.div className={styles.priceCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <h3 className={styles.planName}>Anual</h3>
            <div className={styles.planPrice}>R$ 179,90<span>/ano</span></div>
            <p className={styles.planDesc}>Para profissionais estabelecidos que buscam a melhor relação custo-benefício.</p>
            <ul className={styles.planFeatures}>
              <li><span className={styles.check}>✓</span> Tudo do plano trimestral</li>
              <li><span className={styles.check}>✓</span> Economia de 25% (2 meses grátis)</li>
              <li><span className={styles.check}>✓</span> Biblioteca de Prompts</li>
              <li><span className={styles.check}>✓</span> Suporte prioritário no WhatsApp</li>
            </ul>
            <button className={`${styles.btnCheckout} ${styles.secondary}`} onClick={() => handleCheckout('anual')}>
              Assinar Anual
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        © {new Date().getFullYear()} Foto IA. Todos os direitos reservados.
      </footer>
    </div>
  );
}
