/**
 * Logique centralisée de calcul des moyennes et résultats.
 * Toutes les notes sont normalisées sur 20 avant tout calcul,
 * afin de supporter d'éventuels barèmes différents.
 */

const normalizeNote = (note, bareme) => {
  if (bareme === 20) return note;
  return (note / bareme) * 20;
};

/**
 * Calcule la moyenne d'une liste de notes normalisées.
 * Retourne null si la liste est vide.
 */
const average = (values) => {
  const valid = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, v) => acc + v, 0);
  return sum / valid.length;
};

/**
 * Construit le détail des notes (interrogations / devoirs) pour une
 * matière et un semestre donnés, à partir d'une liste de grades bruts.
 */
const buildSubjectSemesterDetail = (grades) => {
  const interrogations = [null, null, null];
  const devoirs = [null, null];

  grades.forEach((g) => {
    const normalized = normalizeNote(g.note, g.bareme);
    if (g.type === "interrogation" && g.numero >= 1 && g.numero <= 3) {
      interrogations[g.numero - 1] = normalized;
    } else if (g.type === "devoir" && g.numero >= 1 && g.numero <= 2) {
      devoirs[g.numero - 1] = normalized;
    }
  });

  const interrogationsMoyenne = average(interrogations);
  const devoirsMoyenne = average(devoirs);

  const composants = [interrogationsMoyenne, devoirsMoyenne].filter(
    (v) => v !== null
  );

  const subjectAverage = composants.length > 0
    ? composants.reduce((a, b) => a + b, 0) / composants.length
    : null;

  const missing = [];
  interrogations.forEach((val, idx) => {
    if (val === null) missing.push(`interrogation${idx + 1}`);
  });
  devoirs.forEach((val, idx) => {
    if (val === null) missing.push(`devoir${idx + 1}`);
  });

  return {
    interrogations,
    devoirs,
    interrogationsMoyenne,
    devoirsMoyenne,
    average: subjectAverage,
    missing,
  };
};

/**
 * Calcule la moyenne générale pondérée d'un semestre à partir des
 * moyennes par matière et de leurs coefficients.
 */
const computeGeneralAverage = (subjectsWithAverages) => {
  const usable = subjectsWithAverages.filter(
    (s) => s.average !== null && typeof s.coefficient === "number"
  );

  if (usable.length === 0) return null;

  const totalWeighted = usable.reduce(
    (acc, s) => acc + s.average * s.coefficient,
    0
  );
  const totalCoefficients = usable.reduce(
    (acc, s) => acc + s.coefficient,
    0
  );

  if (totalCoefficients === 0) return null;

  return totalWeighted / totalCoefficients;
};

/**
 * Construit le résultat complet d'un élève pour les deux semestres.
 *
 * @param {Object} params
 * @param {Array} params.grades - liste des documents Grade (populés avec subject)
 * @param {Array} params.subjects - liste des matières { _id, nom, coefficient }
 * @returns {Object} résultats structurés par semestre
 */
const buildStudentResults = ({ grades, subjects }) => {
  const semesters = {};

  [1, 2].forEach((semesterNumber) => {
    const subjectsResult = subjects.map((subject) => {
      const subjectGrades = grades.filter(
        (g) =>
          g.semester === semesterNumber &&
          String(g.subject._id || g.subject) === String(subject._id)
      );

      const detail = buildSubjectSemesterDetail(subjectGrades);

      return {
        subject: subject.nom,
        subjectId: String(subject._id),
        coefficient: subject.coefficient,
        grades: {
          interrogations: detail.interrogations,
          devoirs: detail.devoirs,
        },
        average: detail.average !== null
          ? Math.round(detail.average * 100) / 100
          : null,
        missing: detail.missing,
      };
    });

    const generalAverageRaw = computeGeneralAverage(
      subjectsResult.map((s) => ({
        average: s.average,
        coefficient: s.coefficient,
      }))
    );

    semesters[semesterNumber] = {
      subjects: subjectsResult,
      generalAverage:
        generalAverageRaw !== null
          ? Math.round(generalAverageRaw * 100) / 100
          : null,
    };
  });

  return semesters;
};

/**
 * Calcule la moyenne générale d'une classe pour un semestre donné,
 * à partir des résultats de chaque élève.
 */
const computeClassAverage = (studentsResults, semesterNumber) => {
  const averages = studentsResults
    .map((r) => r.semesters?.[semesterNumber]?.generalAverage)
    .filter((v) => v !== null && v !== undefined);

  if (averages.length === 0) return null;

  const sum = averages.reduce((a, b) => a + b, 0);
  return Math.round((sum / averages.length) * 100) / 100;
};

export {
  normalizeNote,
  average,
  buildSubjectSemesterDetail,
  computeGeneralAverage,
  buildStudentResults,
  computeClassAverage,
};
