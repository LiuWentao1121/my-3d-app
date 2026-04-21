import React, { useState, useEffect, useRef } from 'react';
import avatarFile from './1.jpg';
import musicFile from './music.mp3';

const THEME = {
  bg: '#050505',
  primary: '#ffffff',
  secondary: '#00F0FF',
  glass: 'rgba(255, 255, 255, 0.03)',
  border: 'rgba(255, 255, 255, 0.1)',
  fontTitle: "'Inter', sans-serif",
  fontMono: "'JetBrains Mono', monospace"
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@900&family=JetBrains+Mono:wght@400;700&display=swap');

  body {
    margin: 0; background: ${THEME.bg}; color: #fff;
    font-family: ${THEME.fontMono}; overflow-x: hidden;
    cursor: none;
  }
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-thumb { background: ${THEME.primary}; }

  .glass-panel {
    background: ${THEME.glass};
    backdrop-filter: blur(16px);
    border: 1px solid ${THEME.border};
    border-radius: 4px;
    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  }

  @keyframes blink { 50% { opacity: 0; } }
  @keyframes slideIn {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(100%); opacity: 0; }
  }
  @keyframes pulse {
    0% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.2); opacity: 0.7; }
    100% { transform: scale(1); opacity: 0.3; }
  }
`;

/**
 * Neon Cursor: 跟随圆点与延迟拖尾，触摸屏隐藏
 */
const NeonCursor = () => {
  const dot = useRef({ x: 0, y: 0 });
  const delay = useRef({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isTouchDevice = () => {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    };
    if (isTouchDevice()) return;

    const move = (e) => {
      setVisible(true);
      dot.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', move);
    const tick = () => {
      delay.current.x += (dot.current.x - delay.current.x) * 0.15;
      delay.current.y += (dot.current.y - delay.current.y) * 0.15;
      const el = document.getElementById('neon-cursor');
      const trail = document.getElementById('neon-trail');
      if (el && trail) {
        el.style.transform = `translate(${dot.current.x}px, ${dot.current.y}px)`;
        trail.style.transform = `translate(${delay.current.x}px, ${delay.current.y}px)`;
      }
      requestAnimationFrame(tick);
    };
    tick();
    return () => window.removeEventListener('mousemove', move);
  }, []);

  if (!visible) return null;
  return (
    <>
      <div id="neon-cursor" style={{
        position: 'fixed', top: -4, left: -4, width: 8, height: 8,
        backgroundColor: THEME.primary, borderRadius: '50%', zIndex: 999999, pointerEvents: 'none'
      }} />
      <div id="neon-trail" style={{
        position: 'fixed', top: -20, left: -20, width: 40, height: 40,
        border: `1px solid ${THEME.primary}`, borderRadius: '50%', zIndex: 999998,
        pointerEvents: 'none', opacity: 0.5, mixBlendMode: 'screen',
        boxShadow: `0 0 15px ${THEME.primary}`
      }} />
    </>
  );
};

/**
 * Magnetic Button: 鼠标靠近产生磁性吸附效果
 */
const MagneticButton = ({ children, onClick, style = {}, ...props }) => {
  const btnRef = useRef(null);
  const magnetic = useRef({ x: 0, y: 0, bx: 0, by: 0 });

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    const handleMouseMove = (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 150;
      if (dist < maxDist) {
        const force = (maxDist - dist) / maxDist;
        magnetic.current.x = dx * force * 0.4;
        magnetic.current.y = dy * force * 0.4;
      } else {
        magnetic.current.x = 0;
        magnetic.current.y = 0;
      }
    };

    const tick = () => {
      magnetic.current.bx += (magnetic.current.x - magnetic.current.bx) * 0.15;
      magnetic.current.by += (magnetic.current.y - magnetic.current.by) * 0.15;
      if (btn) {
        btn.style.transform = `translate(${magnetic.current.bx}px, ${magnetic.current.by}px)`;
      }
      requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', handleMouseMove);
    tick();
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      style={{
        background: THEME.glass,
        backdropFilter: 'blur(16px)',
        border: `1px solid ${THEME.border}`,
        borderRadius: '4px',
        color: '#fff',
        padding: '12px 24px',
        cursor: 'pointer',
        fontFamily: THEME.fontMono,
        fontSize: '0.9rem',
        transition: 'border-color 0.3s, box-shadow 0.3s',
        ...style
      }}
      onMouseEnter={e => {
        e.target.style.borderColor = THEME.primary;
        e.target.style.boxShadow = `0 0 20px ${THEME.primary}44`;
      }}
      onMouseLeave={e => {
        e.target.style.borderColor = THEME.border;
        e.target.style.boxShadow = 'none';
      }}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * 3D 磁性卡片: 支持倾斜与高亮边框
 */
const WorkCard = ({ project, onClick }) => {
  const cardRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [light, setLight] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    setRotate({ x: (yc - y) / 10, y: (x - xc) / 10 });
    setLight({ x, y, opacity: 1 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={() => { setRotate({ x: 0, y: 0 }); setLight(prev => ({ ...prev, opacity: 0 })); }}
      onClick={() => onClick(project)}
      className="glass-panel"
      style={{
        padding: '2rem', height: '400px', cursor: 'pointer',
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        position: 'relative', overflow: 'hidden',
        boxShadow: rotate.x !== 0 ? `0 20px 50px -10px ${project.color}66` : 'none'
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, opacity: light.opacity,
        background: `radial-gradient(circle at ${light.x}px ${light.y}px, ${project.color}44, transparent 150px)`,
        pointerEvents: 'none'
      }} />
      <div style={{ color: project.color, fontSize: '0.8rem', letterSpacing: '2px' }}>[ PROJECT_0{project.id} ]</div>
      <h3 style={{ fontSize: '2rem', margin: '1rem 0', fontFamily: THEME.fontTitle }}>{project.title}</h3>
      <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>{project.desc}</p>
      <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', display: 'flex', gap: '10px' }}>
        {project.tags.map(tag => (
          <span key={tag} style={{ fontSize: '0.7rem', padding: '4px 8px', border: `1px solid ${THEME.border}` }}>{tag}</span>
        ))}
      </div>
    </div>
  );
};

// --- 项目详情模态框 (全屏滑出) ---
const ProjectModal = ({ project, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 400);
  };

  if (!project) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: THEME.bg,
      overflowY: 'auto',
      animation: isExiting ? 'slideOut 0.4s ease forwards' : 'slideIn 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards'
    }}>
      <NeonCursor />
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 40px',
        background: `${THEME.bg}ee`,
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${THEME.border}`
      }}>
        <span style={{ color: THEME.primary, fontFamily: THEME.fontMono }}>[ {project.title} ]</span>
        <MagneticButton onClick={handleClose}>[ CLOSE_SYSTEM ]</MagneticButton>
      </div>

      <div style={{ padding: '60px 10vw' }}>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontFamily: THEME.fontTitle, marginBottom: '40px', color: 'transparent', WebkitTextStroke: `1px ${THEME.primary}`, textShadow: `0 0 30px ${THEME.primary}44` }}>
          {project.title}
        </h1>

        <div style={{ width: '100%', marginBottom: '60px' }}>
          <img
            src={`https://via.placeholder.com/1200x800/${project.color.slice(1)}/ffffff?text=${encodeURIComponent(project.title + ' COVER')}`}
            alt={project.title}
            style={{ width: '100%', height: 'auto', borderRadius: '8px', border: `1px solid ${THEME.border}` }}
            loading="lazy"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '60px', marginBottom: '60px' }}>
          <div>
            <section style={{ marginBottom: '50px' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', fontFamily: THEME.fontMono, color: 'transparent', WebkitTextStroke: `1px ${THEME.primary}`, textShadow: `0 0 20px ${THEME.primary}44` }}>PROJECT_OVERVIEW</h2>
              <p style={{ fontSize: '1.1rem', lineHeight: 1.8, opacity: 0.85 }}>{project.fullDesc}</p>
            </section>

            <div style={{ width: '100%', marginBottom: '40px' }}>
              <img
                src={`https://via.placeholder.com/1200x1600/${project.color.slice(1)}/ffffff?text=${encodeURIComponent(project.title + ' DETAILS')}`}
                alt="detail"
                style={{ width: '100%', height: 'auto', borderRadius: '8px', border: `1px solid ${THEME.border}` }}
                loading="lazy"
              />
            </div>

            <section style={{ marginBottom: '50px' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', fontFamily: THEME.fontMono, color: 'transparent', WebkitTextStroke: `1px ${THEME.primary}`, textShadow: `0 0 20px ${THEME.primary}44` }}>CHALLENGES</h2>
              <div className="glass-panel" style={{ padding: '30px' }}>
                <p style={{ lineHeight: 1.8, opacity: 0.8 }}>{project.challenges}</p>
              </div>
            </section>

            <section>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', fontFamily: THEME.fontMono, color: 'transparent', WebkitTextStroke: `1px ${THEME.primary}`, textShadow: `0 0 20px ${THEME.primary}44` }}>SOLUTIONS</h2>
              <div className="glass-panel" style={{ padding: '30px' }}>
                <p style={{ lineHeight: 1.8, opacity: 0.8 }}>{project.solutions}</p>
              </div>
            </section>
          </div>

          <aside className="glass-panel" style={{ padding: '40px', height: 'fit-content', position: 'sticky', top: '100px' }}>
            <h3 style={{ color: 'transparent', WebkitTextStroke: `1px ${THEME.primary}`, textShadow: `0 0 20px ${THEME.primary}44`, marginBottom: '30px', fontFamily: THEME.fontMono }}>METRICS</h3>
            {project.metrics.map((m, i) => (
              <div key={i} style={{ marginBottom: '30px', paddingBottom: '30px', borderBottom: i < project.metrics.length - 1 ? `1px solid ${THEME.border}` : 'none' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: project.color }}>{m.value}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '5px' }}>{m.label}</div>
              </div>
            ))}

            <h3 style={{ color: 'transparent', WebkitTextStroke: `1px ${THEME.primary}`, textShadow: `0 0 20px ${THEME.primary}44`, margin: '30px 0 20px', fontFamily: THEME.fontMono }}>TECH_STACK</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {project.tags.map(tag => (
                <span key={tag} className="glass-panel" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>{tag}</span>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

// --- 主应用 ---
const App = () => {
  const canvasRef = useRef(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const avatar = avatarFile;
  const mouse = useRef({ x: -1000, y: -1000 });
  const audioRef = useRef(null);

  // 播放音乐函数
  const playMusic = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => {
        console.log('播放失败:', e);
      });
    }
  };

  const experiences = [
    {
      year: "2025",
      title: "FULL STACK DEVELOPER",
      desc: "独立统筹项目整体架构，完成金融交易系统全套UI搭建、3D可视化功能开发，主导性能优化、兼容性适配与开发流程规范制定。"
    },
    {
      year: "2024",
      title: "FRONTEND ENGINEER",
      desc: "独立搭建大型交互式数据可视化平台，实现满60FPS的丝滑实时渲染，完成全链路功能开发与用户体验打磨。"
    },
    {
      year: "2023",
      title: "JUNIOR DEVELOPER",
      desc: "夯实计算机专业基础，参与多端商业级实训项目开发，熟练掌握React、Node.js等主流开发框架，积累完整工程化开发思维。"
    }
  ];

  // 监听用户首次交互
  useEffect(() => {
    const handleFirstInteraction = () => {
      playMusic();
      // 只触发一次
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
    
    // 监听点击和触摸事件
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  const projects = [
    {
      id: 1, title: "3D_INTERACTIVE_ENGINE", color: THEME.primary,
      desc: "基于原生Canvas的3D图形渲染引擎。",
      fullDesc: "自主研发的3D图形渲染引擎，支持复杂的3D场景构建与实时交互。采用纯原生JavaScript实现，不依赖任何第三方3D库，在保证渲染效果的同时最大化性能。",
      challenges: "如何在没有Three.js等成熟库的情况下，从零实现完整的3D渲染管线？包括透视投影、光照模型、纹理映射、深度检测等核心功能。",
      solutions: "手写矩阵数学库实现3D变换，自定义渲染管线优化drawcall，结合requestAnimationFrame实现流畅的60fps渲染效果。",
      metrics: [
        { value: "60fps", label: "RENDER_FPS" },
        { value: "0依赖", label: "LIB_DEPENDENCY" },
        { value: "30+", label: "3D_PROJECTS" }
      ],
      tags: ["JavaScript", "Canvas", "3D Graphics", "Math Engine"]
    },
    {
      id: 2, title: "DATA_VISUALIZATION_PLATFORM", color: "#00F0FF",
      desc: "大型交互式数据可视化平台。",
      fullDesc: "面向数据分析师的交互式可视化平台，支持海量数据的高效渲染与流畅交互。用户可以实时探索数据，发现隐藏在数字背后的规律与趋势。",
      challenges: "当数据量达到百万级别时，传统的数据绑定方式会导致严重的性能问题。如何在不卡顿的前提下实现数据的实时筛选、聚合与下钻？",
      solutions: "采用WebWorker进行数据处理，主线程只负责渲染。实现虚拟列表与渐进式渲染，只绘制可视区域内的数据点。",
      metrics: [
        { value: "100W+", label: "DATA_POINTS" },
        { value: "<16ms", label: "RENDER_TIME" },
        { value: "50+", label: "CHART_TYPES" }
      ],
      tags: ["React", "D3.js", "WebWorker", "Performance"]
    },
    {
      id: 3, title: "AI_CODING_ASSISTANT", color: "#A020F0",
      desc: "AI赋能的智能开发助手。",
      fullDesc: "集成AI能力的开发辅助工具，能够理解代码上下文，提供智能补全、代码重构建议与bug诊断功能。大幅提升开发效率，减少重复性工作。",
      challenges: "通用大模型在专业编程场景下表现不佳，需要构建领域特定的代码理解能力。同时要考虑响应延迟与上下文长度的限制。",
      solutions: "基于代码知识图谱增强语义理解，实现增量式上下文处理。采用本地缓存与智能预取策略，大幅降低等待时间。",
      metrics: [
        { value: "+40%", label: "CODING_EFFICIENCY" },
        { value: "85%", label: "SUGGESTION_ACCURACY" },
        { value: "10K+", label: "USERS" }
      ],
      tags: ["Node.js", "OpenAI API", "TypeScript", "Electron"]
    },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let donuts = [];
    let globalAngle = { x: 0, y: 0 };
    let floatingParticles = [];

    const DONUT_CONFIGS = [
      { offsetX: 0, offsetY: 0, R: 180, r: 70, color: '#ffffff', speedX: 0.004, speedY: 0.002 },
      { offsetX: 250, offsetY: 180, R: 140, r: 55, color: '#00F0FF', speedX: 0.003, speedY: 0.003 },
      { offsetX: -220, offsetY: -150, R: 130, r: 50, color: '#A020F0', speedX: 0.003, speedY: 0.002 },
      { offsetX: 150, offsetY: -100, R: 100, r: 40, color: '#FF6B6B', speedX: 0.002, speedY: 0.004 },
      { offsetX: -180, offsetY: 120, R: 110, r: 45, color: '#4ECDC4', speedX: 0.004, speedY: 0.001 }
    ];

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      donuts = [];
      floatingParticles = [];
      
      // 初始化粒子环
      DONUT_CONFIGS.forEach(config => {
        const particles = [];
        const count = window.innerWidth < 768 ? 1500 : 3000;
        for (let i = 0; i < count; i++) {
          const u = Math.random() * Math.PI * 2;
          const v = Math.random() * Math.PI * 2;
          particles.push({
            u, v,
            x: 0, y: 0, z: 0,
            vx: 0, vy: 0, vz: 0,
            originalPos: {
              x: (config.R + config.r * Math.cos(v)) * Math.cos(u),
              y: (config.R + config.r * Math.cos(v)) * Math.sin(u),
              z: config.r * Math.sin(v)
            }
          });
        }
        donuts.push({ config, particles });
      });
      
      // 初始化漂浮粒子
      const floatCount = window.innerWidth < 768 ? 100 : 200;
      for (let i = 0; i < floatCount; i++) {
        floatingParticles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.1,
          color: ['#ffffff', '#00F0FF', '#A020F0', '#FF6B6B', '#4ECDC4'][Math.floor(Math.random() * 5)]
        });
      }
    };

    const render = () => {
      ctx.fillStyle = THEME.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      globalAngle.x += 0.003; globalAngle.y += 0.002;

      const focalLength = 500;
      
      // 渲染漂浮粒子
      floatingParticles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加粒子发光效果
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.restore();
        
        // 更新位置
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // 边界检测
        if (particle.x < -50) particle.x = canvas.width + 50;
        if (particle.x > canvas.width + 50) particle.x = -50;
        if (particle.y < -50) particle.y = canvas.height + 50;
        if (particle.y > canvas.height + 50) particle.y = -50;
      });

      // 渲染粒子环
      donuts.forEach(({ config, particles }) => {
        const angleX = globalAngle.x * (config.speedX / 0.004);
        const angleY = globalAngle.y * (config.speedY / 0.002);
        
        particles.forEach(p => {
          let x = p.originalPos.x, y = p.originalPos.y, z = p.originalPos.z;
          let y1 = y * Math.cos(angleX) - z * Math.sin(angleX);
          let z1 = y * Math.sin(angleX) + z * Math.cos(angleX);
          let x2 = x * Math.cos(angleY) + z1 * Math.sin(angleY);
          let z2 = -x * Math.sin(angleY) + z1 * Math.cos(angleY);

          const scale = focalLength / (focalLength + z2);
          const sx = x2 * scale + canvas.width / 2 + config.offsetX;
          const sy = y1 * scale + canvas.height / 2 + config.offsetY;

          const dx = mouse.current.x - sx;
          const dy = mouse.current.y - sy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            p.vx -= dx * 0.1; p.vy -= dy * 0.1;
          }
          p.vx += (x2 - p.x) * 0.05; p.vy += (y1 - p.y) * 0.05; p.vz += (z2 - p.z) * 0.05;
          p.vx *= 0.8; p.vy *= 0.8; p.vz *= 0.8;
          p.x += p.vx; p.y += p.vy; p.z += p.vz;

          const drawScale = focalLength / (focalLength + p.z);
          if (drawScale > 0) {
            ctx.save();
            ctx.fillStyle = config.color;
            ctx.globalAlpha = Math.max(0.4, (p.z + config.r) / (config.r * 2)) * (1 - window.scrollY / 1000);
            
            // 添加粒子发光效果
            ctx.shadowColor = config.color;
            ctx.shadowBlur = 20;
            
            ctx.fillRect(p.x * drawScale + canvas.width / 2 + config.offsetX, p.y * drawScale + canvas.height / 2 + config.offsetY, drawScale * 3, drawScale * 3);
            ctx.restore();
          }
        });
      });
      
      // 绘制粒子之间的连线
      donuts.forEach(({ config, particles }) => {
        const angleX = globalAngle.x * (config.speedX / 0.004);
        const angleY = globalAngle.y * (config.speedY / 0.002);
        
        // 计算粒子位置
        const particlePositions = particles.map(p => {
          let x = p.originalPos.x, y = p.originalPos.y, z = p.originalPos.z;
          let y1 = y * Math.cos(angleX) - z * Math.sin(angleX);
          let z1 = y * Math.sin(angleX) + z * Math.cos(angleX);
          let x2 = x * Math.cos(angleY) + z1 * Math.sin(angleY);
          let z2 = -x * Math.sin(angleY) + z1 * Math.cos(angleY);
          
          const drawScale = focalLength / (focalLength + z2);
          return {
            x: p.x * drawScale + canvas.width / 2 + config.offsetX,
            y: p.y * drawScale + canvas.height / 2 + config.offsetY,
            z: z2
          };
        });
        
        // 绘制连线
        ctx.save();
        ctx.strokeStyle = config.color;
        ctx.globalAlpha = 0.1;
        ctx.lineWidth = 0.5;
        
        for (let i = 0; i < particlePositions.length; i++) {
          for (let j = i + 1; j < particlePositions.length; j++) {
            const dx = particlePositions[i].x - particlePositions[j].x;
            const dy = particlePositions[i].y - particlePositions[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 50) {
              ctx.beginPath();
              ctx.moveTo(particlePositions[i].x, particlePositions[i].y);
              ctx.lineTo(particlePositions[j].x, particlePositions[j].y);
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      });
      
      requestAnimationFrame(render);
    };

    const handleResize = () => { init(); };
    window.addEventListener('resize', handleResize);
    init(); render();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div>
      <style>{GLOBAL_CSS}</style>
      
      <NeonCursor />

      {/* 背景音乐 - 单曲循环 */}
      <audio 
        ref={audioRef}
        src={musicFile} 
        autoPlay 
        loop 
        muted={false}
        playsInline
        crossOrigin="anonymous"
        style={{ display: 'none' }}
        onLoadedMetadata={(e) => {
          e.target.playbackRate = 1.0;
        }}
      >
        您的浏览器不支持音频元素。
      </audio>

      {/* 点击触发播放 */}
      <div onClick={playMusic} style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'auto' }} />
      
      {/* 动态呼吸感背景光晕 */}
      <div style={{ 
        position: 'fixed', 
        top: '-10%', 
        left: '20%', 
        width: '60vw', 
        height: '40vh', 
        background: `conic-gradient(${THEME.primary}22, transparent)`, 
        filter: 'blur(100px)', 
        zIndex: 0,
        animation: 'pulse 8s ease-in-out infinite',
        transformOrigin: 'center',
        opacity: 0.7
      }} />
      <div style={{ 
        position: 'fixed', 
        bottom: '-10%', 
        right: '20%', 
        width: '60vw', 
        height: '40vh', 
        background: `conic-gradient(${THEME.secondary}11, transparent)`, 
        filter: 'blur(100px)', 
        zIndex: 0,
        animation: 'pulse 10s ease-in-out infinite reverse',
        transformOrigin: 'center',
        opacity: 0.6
      }} />
      <div style={{ 
        position: 'fixed', 
        top: '40%', 
        left: '-10%', 
        width: '50vw', 
        height: '50vh', 
        background: `conic-gradient(${THEME.primary}15, transparent)`, 
        filter: 'blur(120px)', 
        zIndex: 0,
        animation: 'pulse 12s ease-in-out infinite',
        transformOrigin: 'center',
        opacity: 0.5
      }} />
      <div style={{ 
        position: 'fixed', 
        bottom: '30%', 
        right: '-10%', 
        width: '40vw', 
        height: '40vh', 
        background: `conic-gradient(#FF6B6B22, transparent)`, 
        filter: 'blur(80px)', 
        zIndex: 0,
        animation: 'pulse 9s ease-in-out infinite reverse',
        transformOrigin: 'center',
        opacity: 0.4
      }} />
      <div style={{ 
        position: 'fixed', 
        top: '10%', 
        right: '30%', 
        width: '45vw', 
        height: '35vh', 
        background: `conic-gradient(#4ECDC422, transparent)`, 
        filter: 'blur(90px)', 
        zIndex: 0,
        animation: 'pulse 11s ease-in-out infinite',
        transformOrigin: 'center',
        opacity: 0.3
      }} />

      <canvas ref={canvasRef} onMouseMove={(e) => mouse.current = { x: e.clientX, y: e.clientY }} style={{ position: 'fixed', inset: 0, zIndex: 1 }} />

      {/* Hero Section */}
      <section style={{ height: '100vh', display: 'flex', alignItems: 'center', padding: '0 10%', position: 'relative', zIndex: 2, pointerEvents: 'none' }}>
        <div>
          <div style={{ color: THEME.primary, letterSpacing: '5px', marginBottom: '1rem' }}>[ INITIALIZING_INTERFACE ]</div>
          <h1 style={{ fontSize: 'clamp(3rem, 10vw, 8rem)', fontWeight: 900, lineHeight: 0.9, margin: 0, fontFamily: THEME.fontTitle }}>
            <span style={{ color: 'transparent', WebkitTextStroke: `1px ${THEME.primary}`, textShadow: `0 0 30px ${THEME.primary}44` }}>PORTFOLIO FOR</span>
            <br />
            <span style={{ color: 'transparent', WebkitTextStroke: `1px ${THEME.primary}`, textShadow: `0 0 30px ${THEME.primary}44` }}>LiuWentao</span>
          </h1>
          <p style={{ marginTop: '2rem', fontSize: '1.2rem', opacity: 0.8 }}>
            &gt; SYSTEM_STATUS: <span style={{ animation: 'blink 1s infinite' }}>ONLINE_</span>
          </p>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={{ padding: '100px 10%', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '80px', position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
          <div style={{ position: 'relative', width: '200px', height: '200px', marginBottom: '2rem' }}>
            <div>
              <img src={avatar} style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: 'grayscale(1)', transition: '0.3s'
              }} onMouseEnter={e => e.target.style.filter = 'grayscale(0)'} onMouseLeave={e => e.target.style.filter = 'grayscale(1)'} />
            </div>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontFamily: THEME.fontTitle, color: 'transparent', WebkitTextStroke: `1px ${THEME.primary}`, textShadow: `0 0 30px ${THEME.primary}44` }}>ABOUT_ME</h2>
          <p style={{ opacity: 0.7, lineHeight: 1.8, marginTop: '1rem' }}>
            计算机专业在读开发者，主攻Web全栈开发、3D图形渲染与智能交互开发。依托扎实的计算机底层知识，结合AI工具赋能开发流程，专注用代码重构数据美学，打造兼具实用价值与视觉冲击力的沉浸式交互作品。
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '2rem', flexWrap: 'wrap' }}>
            {['JavaScript', 'React', '3D Graphics', 'Node.js', 'TypeScript', 'Canvas'].map(s => (
              <span key={s} className="glass-panel" style={{ padding: '5px 15px', fontSize: '0.8rem' }}># {s}</span>
            ))}
          </div>
        </div>
        <div>
          {experiences.map((exp, i) => (
            <div key={i} className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-41px', top: '30px', width: '1px', height: '100%', background: THEME.border }} />
              <div style={{ position: 'absolute', left: '-45px', top: '30px', width: '10px', height: '10px', background: THEME.primary }} />
              <div style={{ color: 'transparent', WebkitTextStroke: `1px ${THEME.primary}`, fontSize: '0.8rem', textShadow: `0 0 10px ${THEME.primary}44` }}>{exp.year} - PRESENT</div>
              <h4 style={{ margin: '10px 0', fontSize: '1.2rem', color: 'transparent', WebkitTextStroke: `1px ${THEME.primary}`, textShadow: `0 0 20px ${THEME.primary}44` }}>{exp.title}</h4>
              <p style={{ opacity: 0.6 }}>{exp.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Work Section */}
      <section style={{ padding: '100px 10%', position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontFamily: THEME.fontTitle, textAlign: 'center', marginBottom: '4rem', color: 'transparent', WebkitTextStroke: `1px ${THEME.primary}`, textShadow: `0 0 30px ${THEME.primary}44` }}>FEATURED_WORKS</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
          {projects.map(p => (
            <WorkCard key={p.id} project={p} onClick={setSelectedProject} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '50px 10%', borderTop: `1px solid ${THEME.border}`, textAlign: 'center', opacity: 0.4, fontSize: '0.7rem', position: 'relative', zIndex: 2 }}>
        © 2026 ARCHITECT_OS // BUILT WITH NATIVE_CANVAS // ALL RIGHTS RESERVED
      </footer>

      {/* Project Modal */}
      {selectedProject && (
        <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </div>
  );
};

export default App;