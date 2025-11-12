import React, { Component } from "react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry"
import withRouter from './withRouter';
import { albums_data } from "../_gallery/albums_data.js"
import { people_data } from "../_gallery/people_data.js"
import SwiperCore, { Keyboard, Pagination, HashNavigation, Navigation } from "swiper";
import { Swiper, SwiperSlide } from 'swiper/react';
import * as exifr from 'exifr'
import 'swiper/swiper.min.css';
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import Modal from 'react-modal';

import { Link } from "react-router-dom";
import "./Collection.css";

SwiperCore.use([Navigation]); // Not sure why but need this for slide navigation buttons to be clickable
Modal.setAppElement('#app');


class Collection extends Component {

  constructor(props) {
    super(props);
    this.state = {
      viewerIsOpen: true ? this.props.params.image != undefined : false,
      exifMap: {}
    };
  }

  modalStateTracker = (event) => {
    var newPath = event.newURL.split("#", 2)
    if (newPath.length < 2) {
      return
    }
    var oldPath = event.oldURL.split("#", 2)
    if (oldPath.length < 2) {
      return
    }

    var closedModalUrl = "/collections/" + this.props.params.collectionType + "/" + this.props.params.collection

    if (this.state.viewerIsOpen) {
      if (
        oldPath[1] != closedModalUrl &&
        newPath[1] == closedModalUrl
      ) {
        this.setState({
          viewerIsOpen: false
        })
        // var page = document.getElementsByTagName('body')[0];
        // page.classList.remove('noscroll');
      }
    }

    if (!this.state.viewerIsOpen) {
      if (
        oldPath[1] == closedModalUrl &&
        newPath[1] != closedModalUrl
      ) {
        this.setState({
          viewerIsOpen: true
        })
        // this.props.navigate("/collections/" + this.props.params.collectionType + "/" + this.props.params.collection + "/" + event.target.attributes.slug.value);
        // var page = document.getElementsByTagName('body')[0];
        // page.classList.add('noscroll');
      }
    }
  }

  onImageLoad = async (event) => {
    const img = event.target;
    const slug = img.dataset.slug;
    try {
      const exif = await exifr.parse(img.src);
      console.log("[", img.src, "] parse exif：", exif);
      
      if (this.state.exifMap[slug]) return;

      this.setState(prev => ({
        exifMap: { ...prev.exifMap, [slug]: exif }
      }));
    } catch (err) {
      console.error("failed to parse exif: ", err);
    }
  }

  openModal = (event) => {

    this.props.navigate("/collections/" + this.props.params.collectionType + "/" + this.props.params.collection + "/" + event.target.attributes.slug.value);
    this.setState({
      viewerIsOpen: true
    })
    // Add listener to detect if the back button was pressed and the modal should be closed
    window.addEventListener('hashchange', this.modalStateTracker, false);
    // var page = document.getElementsByTagName('body')[0];
    // page.classList.add('noscroll');
  };

  closeModal = () => {

    this.props.navigate("/collections/" + this.props.params.collectionType + "/" + this.props.params.collection);
    this.setState({
      viewerIsOpen: false
    })
    // var page = document.getElementsByTagName('body')[0];
    // page.classList.remove('noscroll');
  };

  title = (collectionType) => {
    var titleStr = "Unknown"
    if (collectionType == "albums") {
      titleStr = "Albums"
    }
    else if (collectionType == "people") {
      titleStr = "People"
    }
    return titleStr
  }

  collection = (collectionType, collection) => {
    let data = {}
    if (collectionType == "albums") {
      data = albums_data
    }
    else if (collectionType == "people") {
      data = people_data
    }
    if (collection in data) {
      return data[collection]
    }
    return {}
  }

  render() {
    let collection_data = this.collection(this.props.params.collectionType, this.props.params.collection)
    return (
      <div className="container" >
        <section className="hero is-small">
          <div className="hero-body">
            <nav className="breadcrumb" aria-label="breadcrumbs">
              <ul>
                <li>
                  <i className="fas fa-book fa-lg"></i>
                  <Link className="title is-5" to={"/collections/" + this.props.params.collectionType}>&nbsp;&nbsp;{this.title(this.props.params.collectionType)}</Link>
                </li>
                <li className="is-active">
                  <a className="title is-5">{collection_data["name"]}</a>
                </li>
              </ul>
            </nav>
          </div>
        </section>
        <ResponsiveMasonry
          columnsCountBreakPoints={{ 400: 1, 800: 2, 1200: 3 }}
        >
          <Masonry
            gutter="0.01rem"
          >
            {collection_data["photos"].map((image, i) => (
              <img
                className="gallery-image"
                key={i}
                src={image.srcSet["(500, 500)w"]}
                alt={image.name}
                slug={image.slug}
                loading="lazy"
                onClick={this.openModal}
              />
            ))}
          </Masonry>
        </ResponsiveMasonry>
        <Modal
          isOpen={this.state.viewerIsOpen}
          onRequestClose={this.closeModal}
          preventScroll={true}
          
          style={{
            overlay: {
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            },
            content: {
              inset: '10px',
              padding: '10px',
              backgroundColor: 'rgba(0, 0, 0, 1)',
            }
          }}
        >
          <button className="button is-text modal-close-button" onClick={this.closeModal} >
            <span className="icon is-small">
              <i className="fas fa-times"></i>
            </span>
          </button>
          <Swiper
            slidesPerView={1}
            preloadImages={false}
            navigation={{
              enabled: true,
            }}
            keyboard={{ enabled: true, }}
            pagination={{ clickable: true, }}
            hashNavigation={{
              watchState: true,
            }}
            modules={[Keyboard, HashNavigation, Pagination]}
            className="swiper"
          >
            {
              collection_data["photos"].map(x =>
                <SwiperSlide slug={x.slug} data-hash={"/collections/" + this.props.params.collectionType + "/" + this.props.params.collection + "/" + x.slug}>
                  <div class="swiper-slide-img">
                    <img title={x.name} src={x.src} data-slug={x.slug} onLoad={this.onImageLoad}/>
                  </div>
                  <div class="swiper-slide-sidebar">
                    <div class="sidebar-header">
                      <a href={x.srcSet["orig"]} download class="download-btn">
                        下载原图
                      </a>
                    </div>
                    <div class="sidebar-exif">
                      {this.state.exifMap[x.slug] ? (
                        <ul>
                          <li>
                            <span>
                              <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="translate-x-[-0.5px] translate-y-[-0.5px]" height="15" width="15" xmlns="http://www.w3.org/2000/svg"><path d="M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2"></path><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"></path></svg>
                            </span>
                            <span>{this.state.exifMap[x.slug].Make} {this.state.exifMap[x.slug].Model}</span>
                          </li>
                          <li>
                            <span>
                              <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" class="translate-x-[-0.5px]" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M9.85802 19.71L12 16H5.07026C6.10692 17.7921 7.8188 19.1447 9.85802 19.71ZM4.25204 14H8.5359L5.07103 7.99867C4.38987 9.17566 4 10.5423 4 12C4 12.6906 4.08751 13.3608 4.25204 14ZM6.39496 6.29179L8.5359 10L12 4C9.8171 4 7.8384 4.87429 6.39496 6.29179ZM14.142 4.28998L12 8H18.9297C17.8931 6.20791 16.1812 4.85529 14.142 4.28998ZM19.748 10H15.4641L18.929 16.0013C19.6101 14.8243 20 13.4577 20 12C20 11.3094 19.9125 10.6392 19.748 10ZM17.605 17.7082L15.4641 14L12 20C14.1829 20 16.1616 19.1257 17.605 17.7082ZM12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM13.1547 10H10.8453L9.6906 12L10.8453 14H13.1547L14.3094 12L13.1547 10Z"></path></svg>
                            </span>
                            <span>{this.state.exifMap[x.slug].LensModel}</span>
                          </li>
                          <li><span>{this.state.exifMap[x.slug].FocalLength}mm</span><span>f/{this.state.exifMap[x.slug].FNumber}</span><span>1/{Math.round(1 / this.state.exifMap[x.slug].ExposureTime)}s</span></li>
                          <li><span>ISO {this.state.exifMap[x.slug].ISO}</span></li>
                          <li><span>{this.state.exifMap[x.slug].DateTimeOriginal?.toLocaleString()}</span></li>
                        </ul>
                      ) : (
                        <span>No EXIF</span>
                      )}
                    </div>
                  </div>
                </SwiperSlide>
              )
            }
          </Swiper>
        </Modal>
      </div>
    );
  }
}

export default withRouter(Collection)