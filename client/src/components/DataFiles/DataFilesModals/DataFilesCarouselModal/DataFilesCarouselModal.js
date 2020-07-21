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
import { arrayOf, string, func, shape } from 'prop-types';
import './DataFilesCarouselModal.module.scss';

const DataFilesCarouselThumbnail = ({ link, clickHandler }) => {
  const [loading, setLoading] = useState(true);

  return (
    <div styleName={loading ? 'thumbnail-loading' : 'thumbnail'}>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <button type="button" styleName="image-selector" onClick={clickHandler}>
          &nbsp;
        </button>
      )}
      <img
        type="image"
        src={link}
        styleName="thumbnail-image"
        style={loading ? { display: 'none' } : null}
        onLoad={e => {
          setLoading(false);
        }}
        alt="carousel"
      />
    </div>
  );
};
DataFilesCarouselThumbnail.propTypes = {
  link: string.isRequired,
  clickHandler: func.isRequired
};

const DataFilesCarousel = ({ images, setModalTitle }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const links = images.map(image => image.url);
  const names = images.map(image => image.name);
  React.useEffect(() => {
    setModalTitle(names[activeIndex]);
  }, [images, activeIndex]);
  const next = () => {
    if (animating) return;
    const nextIndex = activeIndex === images.length - 1 ? 0 : activeIndex + 1;
    setActiveIndex(nextIndex);
  };

  const previous = () => {
    if (animating) return;
    const nextIndex = activeIndex === 0 ? images.length - 1 : activeIndex - 1;
    setActiveIndex(nextIndex);
  };

  const goToIndex = newIndex => {
    if (animating) return;
    setActiveIndex(newIndex);
  };

  return (
    <>
      <Carousel
        activeIndex={activeIndex}
        next={next}
        previous={previous}
        interval={false}
        styleName="carousel-root"
      >
        <CarouselIndicators
          items={links}
          activeIndex={activeIndex}
          onClickHandler={goToIndex}
        />
        {images.map((img, idx, arr) => {
          const link = img.url;
          const [loaded, setLoaded] = useState(false);
          const current = idx === activeIndex;
          return (
            <CarouselItem
              styleName="item"
              key={link}
              onExiting={() => setAnimating(true)}
              onExited={() => setAnimating(false)}
            >
              {!loaded && current && (
                <div styleName="loading">
                  <LoadingSpinner />
                </div>
              )}
              <img
                styleName="item"
                src={link}
                alt={img.name}
                style={loaded ? null : { display: 'none' }}
                onLoad={() => setLoaded(true)}
              />

              {loaded && <CarouselCaption captionText={img.name} />}
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
      <div styleName="thumbnail-wrapper">
        {links.map((link, idx) => (
          <DataFilesCarouselThumbnail
            link={link}
            clickHandler={() => goToIndex(idx)}
          />
        ))}
      </div>
    </>
  );
};
DataFilesCarousel.propTypes = {
  images: arrayOf(shape({ name: string.isRequired, url: string.isRequired }))
    .isRequired,
  setModalTitle: func.isRequired
};

const DataFilesCarouselModal = () => {
  const [title, setTitle] = useState('Image Carousel');
  const dispatch = useDispatch();
  const isOpen = useSelector(state => state.files.modals.carousel);
  const images = useSelector(state => {
    return state.files.imagePreviews;
  });
  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'carousel', props: {} }
    });
    dispatch({ type: 'DATA_FILES_SET_CAROUSEL', payload: [] });
  };
  const setModalTitle = name => {
    setTitle(name);
  };
  return (
    <Modal size="lg" isOpen={isOpen} toggle={toggle} className="dataFilesModal">
      <ModalHeader toggle={toggle}>{title}</ModalHeader>
      <ModalBody>
        {isEmpty(images) ? (
          <LoadingSpinner />
        ) : (
          <DataFilesCarousel images={images} setModalTitle={setModalTitle} />
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
  );
};

export default DataFilesCarouselModal;
