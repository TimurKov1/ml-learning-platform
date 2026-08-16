# Production manual check

Date: 2026-08-16

The published NeuroClass domain was checked with admin/admin. The administrator lesson editor displayed the Markdown/LaTeX toolbar, including bold, italic, heading, list, code, and formula actions. Entering Markdown and inline/block LaTeX produced a live preview with rendered heading and KaTeX formulas.

A temporary student account `mdqa_temp` was created for validation, used to open the student workspace and lesson pages, and then deleted. The student page rendered Markdown content and lesson structure correctly. The user separately confirmed that submission notifications arrive for both the administrator and the student.

A temporary published lesson was then created on production with a heading, bold Markdown, a list, inline `$E = mc^2$`, and display `$$\\int_0^1 x^2 dx = \\frac{1}{3}$$`. The student opened that exact lesson and the production page visibly rendered the heading, list, inline formula, and display integral with KaTeX. The temporary lesson and second temporary student account were deleted afterward; production returned to 3 students and 4 lessons.
