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
import { instanceOf } from 'prop-types';

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
        {links.map((link, idx) => {
          return (
            <CarouselItem
              onExiting={() => setAnimating(true)}
              onExited={() => setAnimating(false)}
              key={link}
            >
              <img src={link} alt="ok" />
              <CarouselCaption captionText={`Image ${idx + 1}`} />
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
DataFilesCarousel.propTypes = { links: instanceOf(Array).isRequired };

const DataFilesCarouselModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(state => state.files.modals.carousel);
  const imageURLs = useSelector(state => {
    return state.files.imagePreviews;
  });
  const toggle = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'carousel', props: {} }
    });

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

export default React.memo(DataFilesCarouselModal);
