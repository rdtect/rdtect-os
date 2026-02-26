<script lang="ts">
  import { onMount } from 'svelte';
  import type { Skill } from './data';

  interface Props {
    skills: Skill[];
  }
  let { skills }: Props = $props();

  let animated = $state(false);

  const categoryMeta: Record<string, { label: string; color: string }> = {
    frontend: { label: 'Frontend & Design', color: '#6366f1' },
    backend: { label: 'Backend & Technology', color: '#22c55e' },
    tools: { label: 'Tools & Creative', color: '#ec4899' },
    soft: { label: 'Leadership & Strategy', color: '#06b6d4' },
  };

  // The devops category maps to backend for display
  const categoryOrder = ['frontend', 'backend', 'tools', 'soft'] as const;

  function groupedSkills(): { key: string; label: string; color: string; items: Skill[] }[] {
    const groups: Record<string, Skill[]> = {};
    for (const skill of skills) {
      const cat = skill.category === 'devops' ? 'backend' : skill.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(skill);
    }
    return categoryOrder
      .filter((k) => groups[k]?.length)
      .map((k) => ({
        key: k,
        label: categoryMeta[k].label,
        color: categoryMeta[k].color,
        items: groups[k].sort((a, b) => b.level - a.level),
      }));
  }

  const groups = $derived(groupedSkills());

  onMount(() => {
    requestAnimationFrame(() => { animated = true; });
  });
</script>

<div class="skills-container">
  {#each groups as group, gi (group.key)}
    <div class="skill-group" style="animation-delay: {gi * 100}ms">
      <h3 class="group-title">
        <span class="group-dot" style="background: {group.color}"></span>
        {group.label}
      </h3>
      <div class="skill-list">
        {#each group.items as skill, si (skill.name)}
          <div class="skill-row" style="animation-delay: {gi * 100 + si * 40}ms">
            <div class="skill-header">
              <span class="skill-name">{skill.name}</span>
              <span class="skill-pct">{skill.level}%</span>
            </div>
            <div class="skill-track">
              <div
                class="skill-fill"
                style="
                  width: {animated ? skill.level : 0}%;
                  background: linear-gradient(90deg, {group.color}, {skill.color || group.color});
                "
              ></div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .skills-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    padding: 4px 0 24px;
  }

  .skill-group {
    background: var(--glass-bg-subtle);
    border: 1px solid rgba(99, 102, 241, 0.1);
    border-radius: var(--radius-xl);
    padding: 20px;
    animation: fadeUp 0.4s ease backwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
  }

  .group-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--text-sm);
    font-weight: 700;
    color: #e2e8f0;
    margin: 0 0 16px;
  }

  .group-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .skill-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .skill-row {
    animation: fadeUp 0.3s ease backwards;
  }

  .skill-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .skill-name {
    font-size: var(--text-xs);
    color: #cbd5e1;
    font-weight: 500;
  }

  .skill-pct {
    font-size: 10px;
    color: #64748b;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .skill-track {
    height: 6px;
    background: rgba(30, 41, 59, 0.8);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .skill-fill {
    height: 100%;
    border-radius: var(--radius-full);
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    .skill-group { animation: none; }
    .skill-row { animation: none; }
    .skill-fill { transition: none; }
  }
</style>
