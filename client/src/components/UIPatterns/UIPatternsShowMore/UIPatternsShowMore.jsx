import React from 'react';
import { ShowMore } from '_common';
import styles from './UIPatternsShowMore.module.scss';

function UIPatternsShowMore() {
  return (
    <div className={styles.root}>
      <ShowMore>
        Long text beyond 4 lines should be clamped. Short text should not be
        clamped. This element is responsive to line number changes due to window
        resizing. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis
        dapibus leo ornare sem mollis viverra. Sed metus tortor, luctus vitae
        tempus a, consectetur eu enim. Vivamus euismod ante sed augue aliquam,
        at venenatis risus varius. Duis laoreet, tellus at euismod consequat,
        nulla neque vestibulum sapien, at placerat erat nibh at ligula. Interdum
        et malesuada fames ac ante ipsum primis in faucibus. Vestibulum mattis
        elit non enim gravida tempus. Quisque et nisi ligula. Quisque sagittis
        vel ex sed rhoncus. In lacus purus, elementum vel ullamcorper at,
        accumsan congue sem. Morbi eu mattis magna. Donec arcu ligula, mollis ac
        leo ut, pretium euismod turpis. Maecenas quis elit id dui vehicula
        sagittis semper aliquet enim.
      </ShowMore>
    </div>
  );
}

export default UIPatternsShowMore;
