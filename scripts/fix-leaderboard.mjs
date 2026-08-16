import fs from "node:fs";

const path = "client/src/pages/StudentWorkspace.tsx";
const source = fs.readFileSync(path, "utf8");
const start = source.indexOf("function LeaderboardPage(");
const end = source.indexOf("function LessonListItem(");
if (start < 0 || end < 0 || end <= start) throw new Error("LeaderboardPage boundaries not found");
const replacement = `function LeaderboardPage({ query }: { query: { isLoading: boolean; error: unknown; data?: LeaderboardData; refetch?: () => Promise<unknown> } }) {
  if (query.isLoading) return <LoadingScreen />;
  if (query.error || !query.data) return <ErrorScreen onRetry={() => { void query.refetch?.(); }} />;
  const { entries, currentStudent, totalAssignments } = query.data;
  const podium = entries.slice(0, 3);
  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8 sm:pt-10">
      <div className="max-w-2xl">
        <p className="text-xs font-bold tracking-[.17em] text-[#a47d3a] uppercase">Мотивация и прогресс</p>
        <h1 className="mt-3 font-display text-4xl tracking-[-.05em] sm:text-5xl">Рейтинг учеников.</h1>
        <p className="mt-4 text-base leading-7 text-[#69748a]">Место определяется количеством зачтённых заданий и общим прогрессом курса.</p>
      </div>
      {currentStudent && (
        <div className="mt-8 rounded-3xl bg-[#142440] p-6 text-white shadow-[0_15px_35px_rgba(20,36,64,.16)] sm:flex sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold tracking-[.16em] text-[#ddc48f] uppercase">Ваше место</p><p className="mt-2 font-display text-5xl tracking-[-.06em]">#{currentStudent.rank}</p></div>
          <div className="mt-5 grid grid-cols-2 gap-6 border-t border-white/10 pt-5 sm:mt-0 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
            <div><p className="text-xs text-[#afbdd0]">Зачтено заданий</p><p className="mt-1 text-xl font-semibold">{currentStudent.completedAssignments} / {totalAssignments}</p></div>
            <div><p className="text-xs text-[#afbdd0]">Прогресс курса</p><p className="mt-1 text-xl font-semibold text-[#ddc48f]">{currentStudent.progressPercent}%</p></div>
          </div>
        </div>
      )}
      {entries.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-[#d8d2c7] bg-white px-6 py-14 text-center"><Trophy className="mx-auto h-8 w-8 text-[#b0893e]" /><h2 className="mt-4 text-lg font-semibold">Рейтинг пока пуст</h2><p className="mt-2 text-sm text-[#758095]">Как только появятся ученики, здесь появится таблица лидеров.</p></div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {podium.map(entry => (
              <article key={entry.studentId} className={\`rounded-3xl border p-5 \${entry.isCurrentStudent ? "border-[#c9ab68] bg-[#fffaf0]" : "border-[#e3ddd2] bg-white"}\`}>
                <div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#efe7da] text-[#896726]"><Medal className="h-5 w-5" /></span><span className="font-display text-3xl text-[#a47d3a]">#{entry.rank}</span></div>
                <h2 className="mt-5 truncate font-semibold">{entry.name}{entry.isCurrentStudent && <span className="ml-2 text-xs font-normal text-[#a47d3a]">вы</span>}</h2>
                <p className="mt-2 text-sm text-[#69748a]">{entry.completedAssignments} из {entry.totalAssignments} заданий</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#ede8de]"><div className="h-full rounded-full bg-[#c5a35e]" style={{ width: \`\${entry.progressPercent}%\` }} /></div>
                <p className="mt-2 text-right text-xs font-semibold text-[#8b682a]">{entry.progressPercent}%</p>
              </article>
            ))}
          </div>
          <div className="mt-8 overflow-hidden rounded-3xl border border-[#e3ddd2] bg-white shadow-[0_12px_30px_rgba(30,41,60,.04)]">
            <div className="border-b border-[#eee9e1] bg-[#fcfbf8] px-5 py-4 sm:px-6"><h2 className="font-semibold">Все участники</h2><p className="mt-1 text-xs text-[#8a94a4]">Считаются только зачтённые задания.</p></div>
            <div className="divide-y divide-[#f0ece5]">
              {entries.map(entry => (
                <div key={entry.studentId} className={\`flex items-center gap-3 px-5 py-4 sm:px-6 \${entry.isCurrentStudent ? "bg-[#fffaf0]" : ""}\`}>
                  <span className="w-8 text-center font-display text-xl text-[#a47d3a]">{entry.rank}</span>
                  <div className="min-w-0 flex-1"><p className="truncate font-semibold">{entry.name}{entry.isCurrentStudent && <span className="ml-2 rounded-full bg-[#efe7da] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8b682a]">Вы</span>}</p><div className="mt-2 h-1.5 max-w-sm overflow-hidden rounded-full bg-[#ede8de]"><div className="h-full rounded-full bg-[#c5a35e]" style={{ width: \`\${entry.progressPercent}%\` }} /></div></div>
                  <div className="text-right"><p className="text-sm font-semibold text-[#263652]">{entry.completedAssignments}/{entry.totalAssignments}</p><p className="mt-1 text-xs text-[#8a94a4]">{entry.progressPercent}%</p></div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

`;
fs.writeFileSync(path, source.slice(0, start) + replacement + source.slice(end));
