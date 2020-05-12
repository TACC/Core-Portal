import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Carousel,
  CarouselItem,
  CarouselControl,
  CarouselIndicators,
  CarouselCaption
} from 'reactstrap';
import { LoadingSpinner } from '_common';
import { isEmpty } from 'lodash';
import { arrayOf, string } from 'prop-types';

const DataFilesCarousel = ({ links }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const next = () => {
    if (animating) return;
    const nextIndex = activeIndex === links.length - 1 ? 0 : activeIndex + 1;
    setActiveIndex(nextIndex);
  };

  const previous = () => {
    if (animating) return;
    const nextIndex = activeIndex === 0 ? links.length - 1 : activeIndex - 1;
    setActiveIndex(nextIndex);
  };

  const goToIndex = newIndex => {
    if (animating) return;
    setActiveIndex(newIndex);
  };

  if (isEmpty(links)) return <LoadingSpinner />;
  return (
    links && (
      <Carousel
        activeIndex={activeIndex}
        next={next}
        previous={previous}
        interval={false}
      >
        <CarouselIndicators
          items={links}
          activeIndex={activeIndex}
          onClickHandler={goToIndex}
        />
        {links.map((link, idx, arr) => {
          const [loaded, setLoaded] = useState(false);
          const current = idx === activeIndex;
          return (
            <CarouselItem
              key={link}
              onExiting={() => setAnimating(true)}
              onExited={() => setAnimating(false)}
            >
              <>
                {!loaded && current && (
                  <div style={{ height: '200px' }}>
                    <LoadingSpinner />
                  </div>
                )}
                <img
                  src={link}
                  alt={`Selected Images ${idx + 1}/${arr.length}`}
                  onLoad={() => setLoaded(true)}
                />
              </>
              <CarouselCaption
                captionText={`Image ${idx + 1} of ${arr.length}`}
              />
            </CarouselItem>
          );
        })}
        <CarouselControl
          direction="prev"
          directionText="Previous"
          onClickHandler={previous}
        />
        <CarouselControl
          direction="next"
          directionText="Next"
          onClickHandler={next}
        />
      </Carousel>
    )
  );
};
DataFilesCarousel.propTypes = { links: arrayOf(string).isRequired };

const DataFilesCarouselModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(state => state.files.modals.carousel);
  const imageURLs = useSelector(state => {
    return state.files.imagePreviews;
  });
  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'carousel', props: {} }
    });
    dispatch({ type: 'DATA_FILES_SET_CAROUSEL', payload: [] });
  };

  return (
    <>
      <Modal
        size="lg"
        isOpen={isOpen}
        toggle={toggle}
        className="dataFilesModal"
      >
        <ModalHeader toggle={toggle}>Image Carousel</ModalHeader>
        <ModalBody>
          {isEmpty(imageURLs) ? (
            <LoadingSpinner />
          ) : (
            <DataFilesCarousel links={imageURLs} />
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            color="secondary"
            className="data-files-btn-cancel"
            onClick={toggle}
          >
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default DataFilesCarouselModal;
