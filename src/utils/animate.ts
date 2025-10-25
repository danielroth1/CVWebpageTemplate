export interface ClocLanguageEntry {
    language: string;
    code: number;
}

export function animateNumbers(skills: ClocLanguageEntry[], totalFiles: number, totalCode: number, setAnimatedTotals: React.Dispatch<React.SetStateAction<{ files: number; code: number }>>, setAnimatedSkills: React.Dispatch<React.SetStateAction<Record<string, number>>>) {
  const duration = 2000; // ms full duration for largest number
    const start = performance.now();
    const skillTargets = skills.reduce((acc, s) => { acc[s.language] = s.code; return acc; }, {} as Record<string, number>);
    const maxValue = Math.max(totalFiles || 0, totalCode || 0, ...skills.map(s => s.code));
    function tick(now: number) {
      const elapsed = now - start;
      const baseProgress = Math.min(1, elapsed / duration); // 0->1 over full duration
      // Each value uses a linear mapping so smaller values finish earlier (they reach target once fraction >= value/maxValue)
      const totalFilesValue = Math.round(Math.min(1, baseProgress * (maxValue / (totalFiles || 1))) * (totalFiles || 0));
      const totalCodeValue = Math.round(Math.min(1, baseProgress * (maxValue / (totalCode || 1))) * (totalCode || 0));
      setAnimatedTotals({ files: totalFilesValue, code: totalCodeValue });
      const perSkillEntries = Object.entries(skillTargets).map(([k, v]) => {
        const scaled = Math.round(Math.min(1, baseProgress * (maxValue / (v || 1))) * v);
        return [k, scaled];
      });
      setAnimatedSkills(Object.fromEntries(perSkillEntries));
      if (baseProgress < 1) requestAnimationFrame(tick);
    }
    const r = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(r);
}