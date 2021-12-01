import { diff_match_patch } from 'diff-match-patch';

const diff_type = {
    ADDITION: 'insertion',
    EQUALITY: 'equality',
    DELETION: 'deletion',
}

export function diffText(textA, textB) {
    var dmp = new diff_match_patch();
    var dmpDiff = dmp.diff_main(textA, textB);
    dmp.diff_cleanupSemantic(dmpDiff);

    var transformedDiff = dmpDiff.map((el) => {
      let transformationType = el[0] == 1 ? diff_type.ADDITION : (el[0] == -1 ? diff_type.DELETION : diff_type.EQUALITY);
      return { type: transformationType,
               text: el[1],
               color: (el[0] == 1 ? 'black' : 'grey') };
    });

    return transformedDiff;
}

export function equalityScore(textA, textB) {
    let diff = diffText(textA, textB);
    let sum = diff.reduce((acc, el) => {
        return acc + (el.color == 'grey' ? el.text.length : 0);
    }, 0);
    return sum / textA.length;
}



