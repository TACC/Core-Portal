import React, { useState, useCallback } from 'react';
import { Paginator } from '_common';

function UIPatternsPaginator() {
  const [current, setCurrent] = useState(11);
  const callback = useCallback(
    page => {
      setCurrent(page);
    },
    [setCurrent]
  );
  return (
    <dl>
      <dt>Paginator with callbacks</dt>
      <dd>
        <Paginator pages={20} current={current} callback={callback} />
      </dd>
      <dt>Paginator with one page</dt>
      <dd>
        <Paginator pages={1} current={1} />
      </dd>
      <dt>Paginator with fewer than 7 pages</dt>
      <dd>
        <Paginator pages={4} current={2} />
      </dd>
      <dt>Paginator with current page near start</dt>
      <dd>
        <Paginator pages={20} current={3} />
      </dd>
      <dt>Paginator with current page near end</dt>
      <dd>
        <Paginator pages={20} current={18} />
      </dd>
      <dd>Paginator with a custom spread value</dd>
      <dt>
        <Paginator pages={20} current={11} spread={7} />
      </dt>
    </dl>
  );
}

export default UIPatternsPaginator;
