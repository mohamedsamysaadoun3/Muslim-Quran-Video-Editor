// js/features/project/project-list-ui.js
import { getElement } from '../../core/dom-loader.js';
import { formatTimeAgo, formatTime } from '../../utils/formatters.js';
import eventBus from '../../core/event-bus.js';

const projectsListContainer = getElement('projects-list');
const noProjectsMessage = getElement('no-projects-message');

/**
 * ينشئ عنصر بطاقة مشروع واحد.
 * @param {object} project - بيانات المشروع.
 * @returns {HTMLElement} عنصر بطاقة المشروع الذي تم إنشاؤه.
 */
function createProjectCardElement(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.projectId = project.id;

    const lastUpdated = project.updatedAt ? new Date(project.updatedAt) : new Date(project.createdAt);

    let quranInfo = 'لم يتم تحديد الآيات بعد';
    if (project.surahName && project.selectedAyahs && project.selectedAyahs.length > 0) {
        const firstAyahNum = project.selectedAyahs[0].numberInSurah;
        const lastAyahNum = project.selectedAyahs[project.selectedAyahs.length - 1].numberInSurah;
        quranInfo = `${project.surahName} (${firstAyahNum}-${lastAyahNum})`;
    } else if (project.surah && project.selectedAyahs && project.selectedAyahs.length > 0) {
        const firstAyahNum = project.selectedAyahs[0].numberInSurah;
        const lastAyahNum = project.selectedAyahs[project.selectedAyahs.length - 1].numberInSurah;
        quranInfo = `سورة ${project.surah} (${firstAyahNum}-${lastAyahNum})`;
    }

    // أيقونات Font Awesome
    const quranIcon = '<i class="fas fa-book-quran" style="margin-left: 5px; color: var(--primary-color);"></i>';
    const clockIcon = '<i class="fas fa-clock" style="margin-left: 5px; color: var(--primary-color-lighter);"></i>';
    const durationIcon = '<i class="fas fa-hourglass-half" style="margin-left: 5px; color: var(--secondary-color);"></i>';


    card.innerHTML = `
        <h3>${project.name}</h3>
        <div class="project-meta">
            <span>${quranIcon} ${quranInfo}</span>
            <span>${clockIcon} آخر تحديث: ${formatTimeAgo(lastUpdated)}</span>
            <span>${durationIcon} المدة: ${project.totalDuration > 0 ? formatTime(project.totalDuration) : 'غير محددة'}</span>
        </div>
        <div class="project-actions">
            <button class="edit-project-btn" title="تحرير المشروع"><i class="fas fa-edit"></i> فتح</button>
            <button class="duplicate-project-btn" title="تكرار المشروع"><i class="fas fa-clone"></i> تكرار</button>
            <button class="delete-project-btn" title="حذف المشروع"><i class="fas fa-trash-alt"></i> حذف</button>
        </div>
    `;

    card.querySelector('.edit-project-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        eventBus.emit('loadProjectRequested', project.id);
    });
    card.addEventListener('click', () => { // النقر على البطاقة نفسها يفتح المشروع
        eventBus.emit('loadProjectRequested', project.id);
    });

    card.querySelector('.delete-project-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        eventBus.emit('deleteProjectRequested', { projectId: project.id, projectName: project.name });
    });

    card.querySelector('.duplicate-project-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        eventBus.emit('duplicateProjectRequested', project.id);
    });

    return card;
}

/**
 * يعرض قائمة المشاريع المحفوظة على الشاشة الأولية.
 * @param {Array<object>} projects - مصفوفة من كائنات المشاريع.
 */
export function renderProjectsList(projects) {
    if (!projectsListContainer || !noProjectsMessage) {
        console.error('لم يتم العثور على عناصر واجهة مستخدم قائمة المشاريع.');
        return;
    }

    // مسح المحتوى الحالي مع الحفاظ على رسالة "لا توجد مشاريع" إذا كانت موجودة
    while (projectsListContainer.firstChild && projectsListContainer.firstChild !== noProjectsMessage) {
        projectsListContainer.removeChild(projectsListContainer.firstChild);
    }
    // إذا كانت رسالة "لا توجد مشاريع" هي الابن الوحيد، لا تفعل شيئًا إضافيًا بالمسح

    if (!projects || projects.length === 0) {
        if (!projectsListContainer.contains(noProjectsMessage)) {
             projectsListContainer.appendChild(noProjectsMessage); // تأكد من إضافتها
        }
        noProjectsMessage.style.display = 'block';
    } else {
        noProjectsMessage.style.display = 'none';
        const sortedProjects = projects.sort((a, b) =>
            new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
        );
        sortedProjects.forEach(project => {
            const cardElement = createProjectCardElement(project);
            projectsListContainer.appendChild(cardElement);
        });
    }
}
