import {
  animationCopy as copy, animationItems,
  type AnimationCopy, type ContextAnimationModel, type ContextItem, type ContextRow,
} from './contextAnimation';
import type { DSEQuestion } from './dseQuestions';

const officeRoles = [copy('主席', 'Chairperson'), copy('秘書', 'Secretary'), copy('司庫', 'Treasurer')];
const schoolRoles = [copy('主持', 'Presenter'), copy('記錄員', 'Recorder'), copy('時間管理員', 'Timekeeper')];
const idsOf = (items: ContextItem[]) => items.map(item => item.id);

function row(label: AnimationCopy, ids: string[], style: ContextRow['style'] = 'pool', roles?: AnimationCopy[]): ContextRow {
  return { label, ids: [...ids], style, ...(roles ? { roles } : {}) };
}

/** Keep the question's own formula, explanation and warning paired with its scene. */
function model(question: DSEQuestion, items: ContextItem[], scenes: ContextRow[][]): ContextAnimationModel {
  return {
    key: `dse:${question.id}:${question.variantKey}`,
    title: question.title,
    question: question.problem,
    items,
    steps: question.steps.map((step, index) => ({
      title: step.title,
      reason: step.explanation,
      pitfall: step.commonMistake,
      latex: step.formula,
      rows: scenes[index],
    })),
  };
}

function officeAnimation(question: DSEQuestion): ContextAnimationModel {
  const { n, r } = question.parameters;
  const items = animationItems('employee-', n, copy('員工', 'Employee'), '🧑‍💼', 'generic');
  const ids = idsOf(items);
  const selected = ids.slice(0, r);
  const unselected = ids.slice(r);
  const roles = officeRoles.slice(0, r);
  const remaining = () => row(copy(`未入選的 ${n - r} 位員工`, `${n - r} unselected employees`), unselected);
  const assigned = (label: AnimationCopy) => row(label, selected, 'team', roles);

  return model(question, items, [
    [
      assigned(copy(`示例先選 ${r} 人再分工：同一組人交換職位會是另一結果`, `Example select ${r} employees then assign roles: a role swap would give another outcome`)),
      remaining(),
    ],
    [
      row(copy('示例第一個職位已填好；這位員工不能再選', 'Example first role filled; this employee cannot be selected again'), selected.slice(0, 1), 'team', roles.slice(0, 1)),
      row(copy(`秘書仍有 ${n - 1} 位候選員工；選後再減一`, `${n - 1} employees remain eligible for secretary; one fewer after each choice`), ids.slice(1)),
    ],
    [
      assigned(copy(`示例完整分配：${r} 個不同職位，每人只用一次`, `Example complete assignment: ${r} distinct roles, each employee used once`)),
      remaining(),
    ],
    [
      assigned(copy(`同一示例：先選 ${r} 人，再分配 ${r} 個職位`, `The same example: select ${r} employees, then assign ${r} roles`)),
      remaining(),
    ],
  ]);
}

function restaurantAnimation(question: DSEQuestion): ContextAnimationModel {
  const { mains, drinks, r, k } = question.parameters;
  const d = r - k;
  const mainItems = animationItems('main-', mains, copy('主食', 'Main'), '🍛', 'A');
  const drinkItems = animationItems('drink-', drinks, copy('飲品', 'Drink'), '🥤', 'B');
  const mainIds = idsOf(mainItems);
  const drinkIds = idsOf(drinkItems);
  const selectedMains = mainIds.slice(0, k);
  const selectedDrinks = drinkIds.slice(0, d);
  const mainRemainder = () => row(copy(`未選的 ${mains - k} 款主食`, `${mains - k} unselected mains`), mainIds.slice(k));
  const drinkRemainder = () => row(copy(`未選的 ${drinks - d} 款飲品`, `${drinks - d} unselected drinks`), drinkIds.slice(d));
  const mainsSelection = () => row(copy(`示例選定的 ${k} 款主食：不計順序`, `Example ${k} selected mains: unordered`), selectedMains, 'team');
  const drinksSelection = () => row(copy(`示例選定的 ${d} 款飲品：不計順序`, `Example ${d} selected drinks: unordered`), selectedDrinks, 'team');

  return model(question, [...mainItems, ...drinkItems], [
    [
      row(copy(`全部 ${mains} 款主食：須恰好選 ${k} 款`, `All ${mains} mains: choose exactly ${k}`), mainIds),
      row(copy(`全部 ${drinks} 款飲品：須選 ${r} − ${k} = ${d} 款`, `All ${drinks} drinks: choose ${r} − ${k} = ${d}`), drinkIds),
    ],
    [
      mainsSelection(), mainRemainder(),
      row(copy(`全部 ${drinks} 款飲品：尚未選取`, `All ${drinks} drinks: not yet selected`), drinkIds),
    ],
    [mainsSelection(), mainRemainder(), drinksSelection(), drinkRemainder()],
    [
      row(copy(`示例一組 ${r} 款：恰好 ${k} 主食 + ${d} 飲品；不計順序`, `Example set of ${r}: exactly ${k} mains + ${d} drinks; unordered`), [...selectedMains, ...selectedDrinks], 'team'),
      mainRemainder(), drinkRemainder(),
    ],
  ]);
}

function familyAnimation(question: DSEQuestion): ContextAnimationModel {
  const { adults, children } = question.parameters;
  const n = adults + children;
  const adultItems = animationItems('adult-', adults, copy('成人', 'Adult'), '🧑', 'A');
  const childItems = animationItems('child-', children, copy('兒童', 'Child'), '🧒', 'B');
  const adultIds = idsOf(adultItems);
  const childIds = idsOf(childItems);
  // The unrestricted sample-space scene is also a full, legal line: no missing people.
  const unrestricted = [adultIds[0], childIds[0], ...adultIds.slice(1), ...childIds.slice(1)];
  // The block may be anywhere in a fixed-ended line, not only at an endpoint.
  const bundled = [childIds[0], ...adultIds, ...childIds.slice(1)];
  const internallyOrdered = [childIds[0], ...[...adultIds].reverse(), ...childIds.slice(1)];
  const blockRow = (label: AnimationCopy, ids: string[]): ContextRow => ({
    ...row(label, ids, 'bundle'), highlightIds: [...adultIds],
  });

  return model(question, [...adultItems, ...childItems], [
    [row(copy(`左端 → 右端：全部 ${n} 位家人的一個完整排列（未限制相鄰）`, `Left → right: one complete arrangement of all ${n} family members (unrestricted)`), unrestricted, 'line')],
    [blockRow(copy(`左端 → 右端：${children} 位兒童 + 1 個成人區塊 = ${children + 1} 個外部單元`, `Left → right: ${children} children + 1 adult block = ${children + 1} outer units`), bundled)],
    [blockRow(copy(`示例排好區塊內 ${adults} 位成人：全部 ${n} 人仍各出現一次`, `Example internal order of ${adults} adults: all ${n} people still appear once`), internallyOrdered)],
    [blockRow(copy(`示例有利完整排列：${adults} 位成人連續；分母包括全部 ${n}! 個完整直線排列`, `Example favourable full arrangement: ${adults} consecutive adults; denominator includes all ${n}! complete linear arrangements`), internallyOrdered)],
  ]);
}

function schoolAnimation(question: DSEQuestion): ContextAnimationModel {
  const { teachers, students } = question.parameters;
  const teacherItems = animationItems('teacher-', teachers, copy('老師', 'Teacher'), '🧑‍🏫', 'A');
  const studentItems = animationItems('student-', students, copy('學生', 'Student'), '🧑‍🎓', 'B');
  const teacherIds = idsOf(teacherItems);
  const studentIds = idsOf(studentItems);
  const selectedTeacher = teacherIds.slice(0, 1);
  const selectedStudents = studentIds.slice(0, 2);
  const teacherRemainder = () => row(copy(`未入選的 ${teachers - 1} 位老師`, `${teachers - 1} unselected teachers`), teacherIds.slice(1));
  const studentRemainder = () => row(copy(`未入選的 ${students - 2} 位學生`, `${students - 2} unselected students`), studentIds.slice(2));
  const teacherSelection = () => row(copy('示例選定 1 位老師：尚未指定職位', 'Example one selected teacher: no role assigned yet'), selectedTeacher, 'team');
  // The teacher is deliberately the recorder, not implicitly fixed as presenter.
  const assignedIds = [selectedStudents[0], selectedTeacher[0], selectedStudents[1]];
  const assignment = (label: AnimationCopy) => row(label, assignedIds, 'team', schoolRoles);

  return model(question, [...teacherItems, ...studentItems], [
    [
      teacherSelection(), teacherRemainder(),
      row(copy(`全部 ${students} 位學生：尚未選取`, `All ${students} students: not yet selected`), studentIds),
    ],
    [
      teacherSelection(), teacherRemainder(),
      row(copy('示例選定 2 位學生：不計順序，尚未分工', 'Example two selected students: unordered, roles not yet assigned'), selectedStudents, 'team'),
      studentRemainder(),
    ],
    [
      assignment(copy('示例三人分工：恰好 1 老師、2 學生；老師在此擔任記錄員', 'Example three-person assignment: exactly 1 teacher and 2 students; teacher is recorder here')),
      teacherRemainder(), studentRemainder(),
    ],
    [
      assignment(copy('同一示例方案：合規小組 + 三個不同職位，每人只擔任一個', 'The same example plan: a valid team + three distinct roles, one per person')),
      teacherRemainder(), studentRemainder(),
    ],
  ]);
}

/** One illustrative path for the actual variant; never a fixed-size demo or outcome enumeration. */
export function buildDSEAnimation(question: DSEQuestion): ContextAnimationModel {
  switch (question.id) {
    case 'office-roles': return officeAnimation(question);
    case 'restaurant-selection': return restaurantAnimation(question);
    case 'family-adjacent': return familyAnimation(question);
    case 'school-roles': return schoolAnimation(question);
  }
}
