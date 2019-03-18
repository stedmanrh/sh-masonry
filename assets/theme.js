(function($){
var $ = jQuery = $;

theme.icons = {
  left: '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>',
  right: '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>',
  close: '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
  chevronLeft: '<svg fill="#000000" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M14.298 18.187l1.061-1.061-5.127-5.126 5.127-5.126-1.061-1.061-6.187 6.187z"></path></svg>',
  chevronRight: '<svg fill="#000000" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M9.702 18.187l-1.061-1.061 5.127-5.126-5.127-5.126 1.061-1.061 6.187 6.187z"></path></svg>',
  chevronDown: '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7.41 7.84L12 12.42l4.59-4.58L18 9.25l-6 6-6-6z"/><path d="M0-.75h24v24H0z" fill="none"/></svg>',
  tick: '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
};

theme.Sections = new function(){
  var _ = this;

  _._instances = [];
  _._sections = [];

  _.init = function(){
    $(document).on('shopify:section:load', function(e){
      // load a new section
      var target = _._themeSectionTargetFromShopifySectionTarget(e.target);
      if(target) {
        _.sectionLoad(target);
      }
    }).on('shopify:section:unload', function(e){
      // unload existing section
      var target = _._themeSectionTargetFromShopifySectionTarget(e.target);
      if(target) {
        _.sectionUnload(target);
      }
    });
  }

  // register a type of section
  _.register = function(type, section){
    _._sections.push({ type: type, section: section });
    $('[data-section-type="'+type+'"]').each(function(){
      _.sectionLoad(this);
    });
  }

  // load in a section
  _.sectionLoad = function(target){
    var target = target;
    var section = _._sectionForTarget(target);
    if(section !== false) {
      _._instances.push({
        target: target,
        section: section
      });
      section.onSectionLoad(target);
      $(target).on('shopify:block:select', function(e){
        _._callWith(section, 'onBlockSelect', e.target);
      }).on('shopify:block:deselect', function(e){
        _._callWith(section, 'onBlockDeselect', e.target);
      });
    }
  }

  // unload a section
  _.sectionUnload = function(target){
    var instanceIndex = -1;
    for(var i=0; i<_._instances.length; i++) {
      if(_._instances[i].target == target) {
        instanceIndex = i;
      }
    }
    if(instanceIndex > -1) {
      $(target).off('shopify:block:select shopify:block:deselect');
      _._callWith(_._instances[instanceIndex].section, 'onSectionUnload', target);
      _._instances.splice(instanceIndex);
    }
  }

  // helpers
  _._callWith = function(object, method, param) {
    if(typeof object[method] === 'function') {
      object[method](param);
    }
  }

  _._themeSectionTargetFromShopifySectionTarget = function(target){
    var $target = $('[data-section-type]:first', target);
    if($target.length > 0) {
      return $target[0];
    } else {
      return false;
    }
  }

  _._sectionForTarget = function(target) {
    var type = $(target).attr('data-section-type');
    for(var i=0; i<_._sections.length; i++) {
      if(_._sections[i].type == type) {
        return _._sections[i].section;
      }
    }
    return false;
  }
}

// Loading third party scripts
theme.scriptsLoaded = [];
theme.loadScriptOnce = function(src, callback, beforeRun) {
  if(theme.scriptsLoaded.indexOf(src) < 0) {
    theme.scriptsLoaded.push(src);
    var tag = document.createElement('script');
    tag.src = src;

    if(beforeRun) {
      tag.async = false;
      beforeRun();
    }

    if(typeof callback == 'function') {
      if (tag.readyState) { // IE, incl. IE9
        tag.onreadystatechange = function() {
          if (tag.readyState == "loaded" || tag.readyState == "complete") {
            tag.onreadystatechange = null;
            callback();
          }
        };
      } else {
        tag.onload = function() { // Other browsers
          callback();
        };
      }
    }

    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    return true;
  } else {
    if(typeof callback == 'function') {
      callback();
    }
    return false;
  }
}

// Manage videos
theme.VideoManager = new function(){
  var _ = this;

  // Youtube
  _.youtubeVars = {
    incrementor: 0,
    apiReady: false,
    videoData: {},
    toProcessSelector: '.video-container[data-video-type="youtube"]:not(.video--init)'
  };

  _.youtubeApiReady = function() {
    _.youtubeVars.apiReady = true;
    _._loadYoutubeVideos();
  }

  _._loadYoutubeVideos = function(container) {
    if($(_.youtubeVars.toProcessSelector, container).length) {
      if(_.youtubeVars.apiReady) {
        // play those videos
        $(_.youtubeVars.toProcessSelector, container).addClass('video--init').each(function(){
          _.youtubeVars.incrementor++;
          var containerId = 'theme-yt-video-'+_.youtubeVars.incrementor;
          var videoElement = $('<div>').attr('id', containerId).appendTo(this);
          var autoplay = $(this).data('video-autoplay');
          var player = new YT.Player(containerId, {
            height: '390',
            width: '640',
            videoId: $(this).data('video-id'),
            playerVars: {
              iv_load_policy: 3,
              modestbranding: 1,
              autoplay: autoplay ? 1 : 0,
              rel: 0,
              showinfo: 0
            },
            events: {
              onReady: _._onYoutubePlayerReady.bind({ autoplay: autoplay }),
              onStateChange: _._onYoutubePlayerStateChange
            }
          });
          _.youtubeVars.videoData[player.h.id] = {
            id: containerId,
            container: this,
            videoElement: videoElement,
            player: player
          };
        });
      } else {
        // load api
        theme.loadScriptOnce('https://www.youtube.com/iframe_api');
      }
    }
  }

  _._onYoutubePlayerReady = function(event) {
    event.target.setPlaybackQuality('hd1080');
    if(this.autoplay) {
      event.target.mute();
    }
  }

  _._onYoutubePlayerStateChange = function(event) {
  }

  _._getYoutubeVideoData = function(event) {
    return _.youtubeVars.videoData[event.target.h.id];
  }

  _._unloadYoutubeVideos = function(container) {
    for(var dataKey in _.youtubeVars.videoData) {
      var data = _.youtubeVars.videoData[dataKey];
      if($(container).find(data.container).length) {
        data.player.destroy();
        delete _.youtubeVars.videoData[dataKey];
        return;
      }
    }
  }

  // Vimeo
  _.vimeoVars = {
    incrementor: 0,
    apiReady: false,
    videoData: {},
    toProcessSelector: '.video-container[data-video-type="vimeo"]:not(.video--init)'
  };

  _.vimeoApiReady = function() {
    _.vimeoVars.apiReady = true;
    _._loadVimeoVideos();
  }

  _._loadVimeoVideos = function(container) {
    if($(_.vimeoVars.toProcessSelector, container).length) {
      if(_.vimeoVars.apiReady) {
        // play those videos
        $(_.vimeoVars.toProcessSelector, container).addClass('video--init').each(function(){
          _.vimeoVars.incrementor++;
          var $this = $(this);
          var containerId = 'theme-vi-video-'+_.vimeoVars.incrementor;
          var videoElement = $('<div>').attr('id', containerId).appendTo(this);
          var autoplay = !!$(this).data('video-autoplay');
          var player = new Vimeo.Player(containerId, {
            id: $(this).data('video-id'),
            width: 640,
            loop: false,
            autoplay: autoplay
          });
          player.ready().then(function(){
            if(autoplay) {
              player.setVolume(0);
            }
            if(player.element && player.element.width && player.element.height) {
              var ratio = parseInt(player.element.height) / parseInt(player.element.width);
              $this.css('padding-bottom', (ratio*100) + '%');
            }
          });
          _.vimeoVars.videoData[containerId] = {
            id: containerId,
            container: this,
            videoElement: videoElement,
            player: player,
            autoPlay: autoplay
          };
        });
      } else {
        // load api
        if(window.define) {
          // workaround for third parties using RequireJS
          theme.loadScriptOnce('https://player.vimeo.com/api/player.js', function(){
            _.vimeoVars.apiReady = true;
            _._loadVimeoVideos();
            window.define = window.tempDefine;
          }, function(){
            window.tempDefine = window.define;
            window.define = null;
          });
        } else {
          theme.loadScriptOnce('https://player.vimeo.com/api/player.js', function(){
            _.vimeoVars.apiReady = true;
            _._loadVimeoVideos();
          });
        }
      }
    }
  }

  _._unloadVimeoVideos = function(container) {
    for(var dataKey in _.vimeoVars.videoData) {
      var data = _.vimeoVars.videoData[dataKey];
      if($(container).find(data.container).length) {
        data.player.unload();
        delete _.vimeoVars.videoData[dataKey];
        return;
      }
    }
  }

  // Compatibility with Sections
  this.onSectionLoad = function(container){
    _._loadYoutubeVideos(container);
    _._loadVimeoVideos(container);

    // play button
    $('.video-container__play', container).on('click', function(evt){
      evt.preventDefault();
      // reveal
      var $cover = $(this).closest('.video-container__cover').addClass('video-container__cover--playing');
      // play
      var id = $cover.next().attr('id');
      if(id.indexOf('theme-yt-video') === 0) {
        _.youtubeVars.videoData[id].player.playVideo();
      } else {
        _.vimeoVars.videoData[id].player.play();
      }
    });
  }

  this.onSectionUnload = function(container){
    $('.video-container__play', container).off('click');
    _._unloadYoutubeVideos(container);
    _._unloadVimeoVideos(container);
  }
}

// Youtube API callback
window.onYouTubeIframeAPIReady = function() {
  theme.VideoManager.youtubeApiReady();
}

// A section that contains other sections, e.g. story page
theme.NestedSectionsSection = new function(){
  this.onSectionLoad = function(container){
    // load child sections
    $('[data-nested-section-type]', container).each(function(){
      var type = $(this).attr('data-nested-section-type');
      var section = null;
      for(var i=0; i<theme.Sections._sections.length; i++) {
        if(theme.Sections._sections[i].type == type) {
          section = theme.Sections._sections[i].section;
        }
      }
      if(section) {
        theme.Sections._instances.push({
          target: this,
          section: section
        });
        section.onSectionLoad(this);
      }
    });
  }

  this.onSectionUnload = function(container){
    // unload child sections
    $('[data-nested-section-type]', container).each(function(){
      theme.Sections.sectionUnload(this);
    });
  }

  this.onBlockSelect = function(target){
    // scroll to block
    $(window).scrollTop($(target).offset().top - 100);
  }
}

theme.CustomRowSection = new function(){
  this.onSectionLoad = function(container){
    theme.VideoManager.onSectionLoad(container);
  }

  this.onSectionUnload = function(container){
    theme.VideoManager.onSectionUnload(container);
  }
}

theme.FeaturedProduct = new function(){
  this.onSectionLoad = function(container){
    // gallery
    $('.product-gallery', container).trigger('initProductGallery');

    // product options
    theme.OptionManager.initProductOptions($('select[name="id"]'));

    theme.reloadCurrency();
  }

  this.onSectionUnload = function(container){
    $('.product-gallery', container).off('click');
    theme.OptionManager.unloadProductOptions($('select[name="id"]', container));
  }
}

theme.InstagramSection = new function(){
  this.onSectionLoad = function(target){
    $('.willstagram:not(.willstagram-placeholder)', target).each(function(){
      var user_id = $(this).data('user_id');
      var tag = $(this).data('tag');
      var access_token = $(this).data('access_token');
      var count = $(this).data('count') || 10;
      var showHover = $(this).data('show-hover');
      var $willstagram = $(this);
      var url = '';
      if(typeof user_id != 'undefined') {
        url = 'https://api.instagram.com/v1/users/' + user_id + '/media/recent?count='+count;
      } else if(typeof tag != 'undefined') {
        url = 'https://api.instagram.com/v1/tags/' + tag + '/media/recent?count='+count;
      }
      $.ajax({
        type: "GET",
        dataType: "jsonp",
        cache: false,
        url: url + (typeof access_token == 'undefined'? '' : ('&access_token='+access_token)),
        success: function(res) {
          if(typeof res.data != 'undefined') {
            var $itemContainer = $('<div class="willstagram__items">').appendTo($willstagram);
            var limit = Math.min(20, res.data.length);
            for(var i = 0; i < limit; i++) {
              var photo = res.data[i].images.standard_resolution;
              var photo_small = res.data[i].images.low_resolution;
              var date = new Date(res.data[i].created_time * 1000);
              var $item = $([
                '<div class="willstagram__item">',
                '<a class="willstagram__link rimage-outer-wrapper lazyload fade-in" target="_blank" href="',
                res.data[i].link,
                '" data-bgset="', photo_small.url.replace('http:', ''),' ', photo_small.width, 'w ', photo_small.height, 'h,',
                photo.url.replace('http:', ''), ' ', photo.width, 'w ', photo.height, 'h" data-sizes="auto" data-parent-fit="cover">',
                '<img class="willstagram__img lazyload fade-in" data-src="',
                photo.url.replace('http:', ''),
                '" /></a>',
                '</div>'
              ].join(''));

              if(showHover) {
                theme.willstagramMaskCount = (theme.willstagramMaskCount || 0) + 1;
                var maskId = 'willstagram-svg-mask-' + theme.willstagramMaskCount,
                    gradientId = 'willstagram-svg-grad-' + theme.willstagramMaskCount;
                var $overlay = $([
                  '<div class="willstagram__overlay">',
                  '<div class="willstagram__desc">',
                  res.data[i].caption ? res.data[i].caption.text : '',
                  '</div>',
                  '<div class="willstagram__mask"></div>',
                  '</div>'
                ].join(''));
                if(!res.data[i].caption || res.data[i].caption.text.length == 0) {
                  $overlay.addClass('willstagram__overlay--empty');
                }
                $item.append($overlay);
              }
              $itemContainer.append($item);
            }

            $willstagram.trigger('loaded.willstagram');
          } else if(typeof res.meta !== 'undefined' && typeof res.meta.error_message !== 'undefined') {
            $willstagram.append('<div class="willstagram__error">'+res.meta.error_message+'</div>');
          }
        }
      });

      if(typeof $(this).data('account') != 'undefined') {
        var splSel = $(this).data('account').split('|');
        var $account = $(this).closest(splSel[0]).find(splSel[1]);
        $.ajax({
          type: "GET",
          dataType: "jsonp",
          url: 'https://api.instagram.com/v1/users/self/?access_token='+access_token,
          success: function(res) {
            if(typeof res.data != 'undefined') {
              $account.find('a').attr({
                href: 'https://www.instagram.com/'+res.data.username,
                target: '_blank'
              });
            }
          }
        });
      }
    });
  }
}

theme.SlideshowSection = new function(){
  this.onSectionLoad = function(target){
    $('.slideshow', target).each(function(){
      $(this).on('init', function(){
        $('.lazyload--manual', this).removeClass('.lazyload--manual').addClass('lazyload');
      }).slick({
        autoplay: $(this).hasClass('auto-play'),
        fade: true,
        infinite: true,
        useTransform: true,
        prevArrow: '<button type="button" class="slick-prev">'+theme.icons.chevronLeft+'</button>',
        nextArrow: '<button type="button" class="slick-next">'+theme.icons.chevronRight+'</button>',
        responsive: [
          {
            breakpoint: 768,
            settings: {
              fade: false,
              arrows: false
            }
          }
        ],
        autoplaySpeed: parseInt($(this).data('slideshow-interval'))

      }).on('setPosition', function(e, slick){
        // ensure text overlay is fully visible
        var _this = this;
        setTimeout(function(){
          var isBumped = false;
          var tallestSlide = 0;
          $('.slick-slide', _this).each(function(){
            var $img = $(this).children('img:first');
            if($img.length == 0) { return; }
            var imgHeight = $img.height();
            tallestSlide = Math.max(tallestSlide, $img.height());
            $('.overlay-text', this).each(function(){
              var overlayVerticalInset = $(this).position().top;
              var overlayHeight = 2*overlayVerticalInset + $(this).children('.inner').height();
              if(overlayHeight > imgHeight) {
                isBumped = true;
              }
              tallestSlide = Math.max(tallestSlide, overlayHeight);
            });
          });
          if(isBumped) {
            $('.slick-slide', _this).addClass('slide--using-background').each(function(){
              $(this).css({
                minHeight: tallestSlide,
                backgroundImage: "url('"+$(this).find('img').attr('src')+"')"
              });
            });
          } else {
            $('.slick-slide', _this).removeClass('slide--using-background').css({
              minHeight: '',
              backgroundImage: ''
            });
          }
        }, 11);
      });
    });

    theme.resizeScalingTextFromColumn();

    // Make slideshow page height
    $('.slideshow.type-full-page:not(.full-page-init)', target).addClass('full-page-init').each(function(){
      var $this = $(this);
      $(window).on('debouncedresize checkfullheightsliders', function(){
        $this.find('.slide').css('height', $(window).height() - $('.page-header').outerHeight());
      }).trigger('checkfullheightsliders');
    });
  }

  this.onSectionUnload = function(target){
    $('.slick-slider', target).off('setPosition init').slick('unslick');
  }

  this.onBlockSelect = function(target){
    $(target).closest('.slick-slider')
      .slick('slickGoTo', $(target).data('slick-index'))
      .slick('slickPause');
  }

  this.onBlockDeselect = function(target){
    $(target).closest('.slick-slider').slick('slickPlay');
  }
}

theme.ImageWithTextOverlay = new function(){
  var _ = this;
  _.checkTextOverImageHeights = function(){
    $('[data-section-type="image-with-text-overlay"], [data-nested-section-type="image-with-text-overlay"]').has('.overlay-text').each(function(){
      var $imageContainer = $('.rimage-outer-wrapper', this);
      var imageHeight = $('.rimage-wrapper', this).outerHeight();
      var textVerticalPadding = $('.overlay-text', this).position().top;
      var textHeight = $('.overlay-text > .inner', this).height() + textVerticalPadding * 2;
      if(textHeight > imageHeight + 2) { // +2 for rounding errors
        $imageContainer.css('height', textHeight);
      } else {
        $imageContainer.css('height', '');
      }
    });
  }

  this.onSectionLoad = function(target){
    theme.resizeScalingTextFromColumn();
    _.checkTextOverImageHeights();
    $(window).off('.imageWithTextOverlaySection');
    $(window).on('load.imageWithTextOverlaySection', _.checkTextOverImageHeights);
    $(window).on('resize.imageWithTextOverlaySection', _.checkTextOverImageHeights);
  }

  this.onSectionUnload = function(target){
    $(window).off('.imageWithTextOverlaySection');
  }
}

theme.MapSection = new function(){
  var _ = this;
  _.config = {
    zoom: 14,
    styles: {
      default: [],
      silver: [{"elementType":"geometry","stylers":[{"color":"#f5f5f5"}]},{"elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"elementType":"labels.text.fill","stylers":[{"color":"#616161"}]},{"elementType":"labels.text.stroke","stylers":[{"color":"#f5f5f5"}]},{"featureType":"administrative.land_parcel","elementType":"labels.text.fill","stylers":[{"color":"#bdbdbd"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#eeeeee"}]},{"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#757575"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#e5e5e5"}]},{"featureType":"poi.park","elementType":"labels.text.fill","stylers":[{"color":"#9e9e9e"}]},{"featureType":"road","elementType":"geometry","stylers":[{"color":"#ffffff"}]},{"featureType":"road.arterial","elementType":"labels.text.fill","stylers":[{"color":"#757575"}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#dadada"}]},{"featureType":"road.highway","elementType":"labels.text.fill","stylers":[{"color":"#616161"}]},{"featureType":"road.local","elementType":"labels.text.fill","stylers":[{"color":"#9e9e9e"}]},{"featureType":"transit.line","elementType":"geometry","stylers":[{"color":"#e5e5e5"}]},{"featureType":"transit.station","elementType":"geometry","stylers":[{"color":"#eeeeee"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#c9c9c9"}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#9e9e9e"}]}],
      retro: [{"elementType":"geometry","stylers":[{"color":"#ebe3cd"}]},{"elementType":"labels.text.fill","stylers":[{"color":"#523735"}]},{"elementType":"labels.text.stroke","stylers":[{"color":"#f5f1e6"}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#c9b2a6"}]},{"featureType":"administrative.land_parcel","elementType":"geometry.stroke","stylers":[{"color":"#dcd2be"}]},{"featureType":"administrative.land_parcel","elementType":"labels.text.fill","stylers":[{"color":"#ae9e90"}]},{"featureType":"landscape.natural","elementType":"geometry","stylers":[{"color":"#dfd2ae"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#dfd2ae"}]},{"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#93817c"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#a5b076"}]},{"featureType":"poi.park","elementType":"labels.text.fill","stylers":[{"color":"#447530"}]},{"featureType":"road","elementType":"geometry","stylers":[{"color":"#f5f1e6"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#fdfcf8"}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#f8c967"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#e9bc62"}]},{"featureType":"road.highway.controlled_access","elementType":"geometry","stylers":[{"color":"#e98d58"}]},{"featureType":"road.highway.controlled_access","elementType":"geometry.stroke","stylers":[{"color":"#db8555"}]},{"featureType":"road.local","elementType":"labels.text.fill","stylers":[{"color":"#806b63"}]},{"featureType":"transit.line","elementType":"geometry","stylers":[{"color":"#dfd2ae"}]},{"featureType":"transit.line","elementType":"labels.text.fill","stylers":[{"color":"#8f7d77"}]},{"featureType":"transit.line","elementType":"labels.text.stroke","stylers":[{"color":"#ebe3cd"}]},{"featureType":"transit.station","elementType":"geometry","stylers":[{"color":"#dfd2ae"}]},{"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#b9d3c2"}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#92998d"}]}],
      dark: [{"elementType":"geometry","stylers":[{"color":"#212121"}]},{"elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"elementType":"labels.text.fill","stylers":[{"color":"#757575"}]},{"elementType":"labels.text.stroke","stylers":[{"color":"#212121"}]},{"featureType":"administrative","elementType":"geometry","stylers":[{"color":"#757575"}]},{"featureType":"administrative.country","elementType":"labels.text.fill","stylers":[{"color":"#9e9e9e"}]},{"featureType":"administrative.land_parcel","stylers":[{"visibility":"off"}]},{"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"color":"#bdbdbd"}]},{"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#757575"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#181818"}]},{"featureType":"poi.park","elementType":"labels.text.fill","stylers":[{"color":"#616161"}]},{"featureType":"poi.park","elementType":"labels.text.stroke","stylers":[{"color":"#1b1b1b"}]},{"featureType":"road","elementType":"geometry.fill","stylers":[{"color":"#2c2c2c"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#8a8a8a"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#373737"}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#3c3c3c"}]},{"featureType":"road.highway.controlled_access","elementType":"geometry","stylers":[{"color":"#4e4e4e"}]},{"featureType":"road.local","elementType":"labels.text.fill","stylers":[{"color":"#616161"}]},{"featureType":"transit","elementType":"labels.text.fill","stylers":[{"color":"#757575"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#3d3d3d"}]}],
      night: [{"elementType":"geometry","stylers":[{"color":"#242f3e"}]},{"elementType":"labels.text.fill","stylers":[{"color":"#746855"}]},{"elementType":"labels.text.stroke","stylers":[{"color":"#242f3e"}]},{"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]},{"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#263c3f"}]},{"featureType":"poi.park","elementType":"labels.text.fill","stylers":[{"color":"#6b9a76"}]},{"featureType":"road","elementType":"geometry","stylers":[{"color":"#38414e"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#212a37"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#9ca5b3"}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#746855"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#1f2835"}]},{"featureType":"road.highway","elementType":"labels.text.fill","stylers":[{"color":"#f3d19c"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#2f3948"}]},{"featureType":"transit.station","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#17263c"}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#515c6d"}]},{"featureType":"water","elementType":"labels.text.stroke","stylers":[{"color":"#17263c"}]}],
      aubergine: [{"elementType":"geometry","stylers":[{"color":"#1d2c4d"}]},{"elementType":"labels.text.fill","stylers":[{"color":"#8ec3b9"}]},{"elementType":"labels.text.stroke","stylers":[{"color":"#1a3646"}]},{"featureType":"administrative.country","elementType":"geometry.stroke","stylers":[{"color":"#4b6878"}]},{"featureType":"administrative.land_parcel","elementType":"labels.text.fill","stylers":[{"color":"#64779e"}]},{"featureType":"administrative.province","elementType":"geometry.stroke","stylers":[{"color":"#4b6878"}]},{"featureType":"landscape.man_made","elementType":"geometry.stroke","stylers":[{"color":"#334e87"}]},{"featureType":"landscape.natural","elementType":"geometry","stylers":[{"color":"#023e58"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#283d6a"}]},{"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#6f9ba5"}]},{"featureType":"poi","elementType":"labels.text.stroke","stylers":[{"color":"#1d2c4d"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#023e58"}]},{"featureType":"poi.park","elementType":"labels.text.fill","stylers":[{"color":"#3C7680"}]},{"featureType":"road","elementType":"geometry","stylers":[{"color":"#304a7d"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#98a5be"}]},{"featureType":"road","elementType":"labels.text.stroke","stylers":[{"color":"#1d2c4d"}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#2c6675"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#255763"}]},{"featureType":"road.highway","elementType":"labels.text.fill","stylers":[{"color":"#b0d5ce"}]},{"featureType":"road.highway","elementType":"labels.text.stroke","stylers":[{"color":"#023e58"}]},{"featureType":"transit","elementType":"labels.text.fill","stylers":[{"color":"#98a5be"}]},{"featureType":"transit","elementType":"labels.text.stroke","stylers":[{"color":"#1d2c4d"}]},{"featureType":"transit.line","elementType":"geometry.fill","stylers":[{"color":"#283d6a"}]},{"featureType":"transit.station","elementType":"geometry","stylers":[{"color":"#3a4762"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#0e1626"}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#4e6d70"}]}]
    }
  };
  _.apiStatus = null;
  _.mapsToLoad = [];

  this.geolocate = function($map) {
    var deferred = $.Deferred();
    var geocoder = new google.maps.Geocoder();
    var address = $map.data('address-setting');

    geocoder.geocode({ address: address }, function(results, status) {
      if (status !== google.maps.GeocoderStatus.OK) {
        deferred.reject(status);
      }

      deferred.resolve(results);
    });

    return deferred;
  }

  this.createMap = function(container) {
    var $map = $('.map-section__map-container', container);

    return _.geolocate($map)
      .then(
        function(results) {
          var mapOptions = {
            zoom: _.config.zoom,
            styles: _.config.styles[_.style],
            center: results[0].geometry.location,
            scrollwheel: false,
            disableDoubleClickZoom: true,
            disableDefaultUI: true,
            zoomControl: true
          };

          _.map = new google.maps.Map($map[0], mapOptions);
          _.center = _.map.getCenter();

          var marker = new google.maps.Marker({
            map: _.map,
            position: _.center,
            clickable: false
          });

          google.maps.event.addDomListener(window, 'resize', function() {
            google.maps.event.trigger(_.map, 'resize');
            _.map.setCenter(_.center);
          });
        }.bind(this)
      )
      .fail(function() {
        var errorMessage;

        switch (status) {
          case 'ZERO_RESULTS':
            errorMessage = theme.strings.addressNoResults;
            break;
          case 'OVER_QUERY_LIMIT':
            errorMessage = theme.strings.addressQueryLimit;
            break;
          default:
            errorMessage = theme.strings.addressError;
            break;
        }

        // Only show error in the theme editor
        if (Shopify.designMode) {
          var $mapContainer = $map.parents('.map-section');

          $mapContainer.addClass('page-width map-section--load-error');
          $mapContainer
            .find('.map-section__wrapper')
            .html(
              '<div class="errors text-center">' + errorMessage + '</div>'
            );
        }
      });
  }

  this.onSectionLoad = function(target){
    var $container = $(target);
    // Global function called by Google on auth errors
    window.gm_authFailure = function() {
      if (!Shopify.designMode) return;

      $container.addClass('page-width map-section--load-error');
      $container
        .find('.map-section__wrapper')
        .html(
          '<div class="errors text-center">' + theme.strings.authError + '</div>'
        );
    }

    // create maps
    var key = $container.data('api-key');
    _.style = $container.data('map-style');

    if (typeof key !== 'string' || key === '') {
      return;
    }

    if (_.apiStatus === 'loaded') {
      // Check if the script has previously been loaded with this key
      var $script = $('script[src*="' + key + '&"]');
      if ($script.length === 0) {
        $.getScript(
          'https://maps.googleapis.com/maps/api/js?key=' + key
        ).then(function() {
          _.apiStatus = 'loaded';
          _.createMap($container);
        });
      } else {
        _.createMap($container);
      }
    } else {
      _.mapsToLoad.push($container);

      if (_.apiStatus !== 'loading') {
        _.apiStatus = 'loading';
        if (typeof window.google === 'undefined') {
          $.getScript(
            'https://maps.googleapis.com/maps/api/js?key=' + key
          ).then(function() {
            _.apiStatus = 'loaded';
            // API has loaded, load all Map instances in queue
            $.each(_.mapsToLoad, function(index, mapContainer) {
              _.createMap(mapContainer);
            });
          });
        }
      }
    }
  }

  this.onSectionUnload = function(target){
    if (typeof window.google !== 'undefined') {
      google.maps.event.clearListeners(this.map, 'resize');
    }
  }
}

theme.HeaderSection = new function(){
  // set navbar 'top' value based on screen size and header position
  this.assessHeaderHeight = function(){
    var $header = $('.page-header'),
        navBarTop = '',
        contentTop = '';
    if($header.length && $header.css('position') == 'fixed') {
      var headerHeight = $header.outerHeight();
      contentTop = headerHeight;
      if($header.hasClass('page-header--full-width')) {
        navBarTop = headerHeight;
      }
    }

    $('#navbar').css('top', navBarTop);
    $('#content').css('padding-top', contentTop);
  }

  this.onSectionLoad = function(target){
    // Expand sidebar nav on page load, and limit expanded items to 1
    $('.mainnav .tier1 > ul > li.expanded:first > a').each(function(){
      var $tier1 = $(this).closest('.tier1');
      // only show if inside-mode
      if($('#navbar').hasClass('nav-style-in')) {
        $tier1.addClass('removetrans showback');
        $(this).click();
      }
      // only one expanded item allowed
      $(this).closest('li').siblings('.expanded').removeClass('expanded');
      setTimeout(function(){
        $tier1.removeClass('removetrans');
      }, 10);
    });

    // ensure top edge of nav is correct
    this.assessHeaderHeight();
    $(window).on('load debouncedresize', this.assessHeaderHeight);

    // search
    $(target).on('click', '.search, .quick-search__close, .quick-search-close-mask', function(){
      clearTimeout(theme.liveSearchHeaderClassTimeoutId);
      if($('body').toggleClass('show-quick-search').hasClass('show-quick-search')) {
        $(this).closest('.page-header').find('.quick-search').find('input:first').focus();
        $('body').addClass('page-header-above-mask');
      } else {
        theme.liveSearchHeaderClassTimeoutId = setTimeout(function(){
          $('body').removeClass('page-header-above-mask');
        }, 500);
      }
      return false;
    });

    var searchTimeoutThrottle = 500;
    var searchTimeoutID = -1;
    var currReqObj = null;
    var $resultsBox = $('.quick-search__results', target);
    var $resultItemsBox = $('.quick-search__results-items', target);
    $(target).on('keyup change', '.quick-search__input', function(){
      //Only search if search string longer than 2, and it has changed
      if($(this).val().length > 2 && $(this).val() != $(this).data('oldval')) {
        //Reset previous value
        $(this).data('oldval', $(this).val());

        // Kill outstanding ajax request
        if(currReqObj != null) currReqObj.abort();

        // Kill previous search
        clearTimeout(searchTimeoutID);

        var $form = $(this).closest('form');

        //Search term
        var term = '*' + $form.find('input[name="q"]').val() + '*';

        //Types
        var types = $form.find('input[name="type"]').val();

        //URL for full search page
        var linkURL = $form.attr('action') + '?type=' + types + '&q=' + term;

        //Show loading
        $resultsBox.addClass('quick-search__results--loading');

        // Do next search (in X milliseconds)
        searchTimeoutID = setTimeout(function(){
          //Ajax hit on search page
          currReqObj = $.ajax({
            url: $form.attr('action'),
            data: {
              type: types,
              q: term,
            },
            dataType: "html",
            success: function(data){
              currReqObj = null;
              $resultsBox.removeClass('quick-search__results--loading');
              var $parsedResultsContainer = $('<div>' + data + '</div>').find('.search-results');
              var $results =  $parsedResultsContainer.find('.block');
              if($results.length == 0) {
                // No results
                $resultsBox.removeClass('quick-search__results--populated').addClass('quick-search__results--empty');
                $resultItemsBox.html('<div class="quick-search__empty-message">' + "No results" + '</div>');
              } else {
                // Numerous results
                $resultsBox.removeClass('quick-search__results--empty').addClass('quick-search__results--populated');
                $results.append([
                  '<a href="', linkURL, '" class="quick-search__show-all cta-link-hover-parent">',
                  '<span class="quick-search__show-all-text">',
                  '<span class="quick-search__show-all-text cta-link">',
                  "See all [[count]] results".replace('[[count]]', $parsedResultsContainer.data('results-total')),
                  '</span>',
                  '</span>',
                  '</a>'].join(''));
                $resultItemsBox.empty().append($results);
                theme.reloadCurrency();
              }
            }
          });
        }, searchTimeoutThrottle);
      } else if ($(this).val().length <= 2) {
        //Deleted text? Clear results
        $resultsBox.removeClass('quick-search__results--loading quick-search__results--populated');
        $resultItemsBox.empty();
      }
    });

    // Search should mimic quick-search query
    $(target).on('submit', '.quick-search__form', function(e){
      var val = $(this).find('.quick-search__input').val();
      if(val.length > 0) {
        e.preventDefault();
        var term = '*' + val + '*';
        var type = $(this).find('input[name="type"]').val() || '';
        var linkURL = $(this).attr('action') + '?type=' + type + '&q=' + term;
        window.location = linkURL;
      }
    });

    // Touch events for fly-out nav
    if($('.nav-style-out', target).length) {
      var $body = $('body');
      $(target).on('touchstart touchend click', '.tier1title[aria-haspopup="true"]', function(evt){
        if(!$body.hasClass('show-nav-mobile')) {
          if(evt.type == 'touchstart') {
            $(this).data('touchstartedAt', evt.timeStamp);
          } else if(evt.type == 'touchend') {
            // down & up in under a second - presume tap
            if(evt.timeStamp - $(this).data('touchstartedAt') < 1000) {
              $(this).data('touchOpenTriggeredAt', evt.timeStamp);
              if($(this).parent().hasClass('outside-expanded')) {
                // trigger close
                $(this).parent().trigger('mouseleave');
              } else {
                // trigger close on any open items
                $('.outside-expanded').trigger('mouseleave');
                // trigger open
                $(this).parent().trigger('mouseenter');
              }
              // prevent fake click
              return false;
            }
          } else if(evt.type == 'click') {
            // if touch open was triggered very recently, prevent click event
            if($(this).data('touchOpenTriggeredAt') && evt.timeStamp - $(this).data('touchOpenTriggeredAt') < 1000) {
              return false;
            }
          }
        }
      });
    }
  }

  this.onSectionUnload = function(target){
    $(target).off('click keyup change submit touchstart touchend');
    $(window).off('load debouncedresize', this.assessHeaderHeight);
  }
}

theme.FooterSection = new function(){
  this.onSectionLoad = function(container){
    if($('.nav-column__title', container).length) {
      $(container).on('click', '.nav-column__title .button', function(){
        $(this).closest('.page-footer__nav-column').toggleClass('open');
      });
    }
  }

  this.onSectionUnload = function(container){
    $(container).off('click');
  }
}

theme.ProductTemplateSection = new function(){
  this.onSectionLoad = function(container){
    // reviews link
    $('.themed-product-reviews', container).on('click', '.spr-badge', function(){
      $('html, body').animate({ scrollTop: $('#shopify-product-reviews').offset().top - 50 }, 1000);
    });

    // gallery
    $('.product-gallery', container).trigger('initProductGallery');

    // product options
    theme.OptionManager.initProductOptions($('select[name="id"]'));

    // size chart link
    $('.size-chart-link', container).on('click', function(){
      $.fancybox({
        content: $(this).closest('.size-chart-container').find('.size-chart-content').html()
      });
      return false;
    });

    // related products layout
    $(document).trigger('loadmasonry');

    theme.reloadCurrency();
  }

  this.onSectionUnload = function(container){
    $('.product-gallery', container).off('click');
    theme.OptionManager.unloadProductOptions($('select[name="id"]', container));
    $('.blocklayout', container).masonry('destroy');
    $('.size-chart-link', container).off('click');
    $('.themed-product-reviews', container).off('click');
  }
}

theme.CartTemplateSection = new function(){
  this.onSectionLoad = function(target){
    if($('#note', target).length) {
      $('#checkout-note', target).toggleClass('hide-note', $('#note', target).val().length <= 0);
      $('#toggle-note', target).on('click', function(){
        $('#checkout-note', target).toggleClass('hide-note');
        return false;
      });
    }

    theme.reloadCurrency();
  }

  this.onSectionUnload = function(target) {
    $('#toggle-note', target).off('click');
  }
}

theme.FeaturedCollectionSection = new function(){
  this.onSectionLoad = function(target){
    $(document).trigger('loadmasonry');

    theme.reloadCurrency();
  }

  this.onSectionUnload = function(target){
    $('.blocklayout', target).masonry('destroy');
  }
}

theme.FeaturedCollectionsSection = new function(){
  this.onSectionLoad = function(target){
    $(document).trigger('loadmasonry');
  }

  this.onSectionUnload = function(target){
    $('.blocklayout', target).masonry('destroy');
  }
}

theme.CollectionTemplateSection = new function(){
  this.onSectionLoad = function(target){
    // Sorting
    var $sortBy = $('#sort-by', target);
    if($sortBy.length > 0) {
      var queryParams = {};
      if (location.search.length) {
        for (var aKeyValue, i = 0, aCouples = location.search.substr(1).split('&'); i < aCouples.length; i++) {
          aKeyValue = aCouples[i].split('=');
          if (aKeyValue.length > 1) {
            queryParams[decodeURIComponent(aKeyValue[0])] = decodeURIComponent(aKeyValue[1]);
          }
        }
      }
      $sortBy.val($sortBy.data('initval')).trigger('change').on('change', function() {
        queryParams.sort_by = $(this).val();
        location.search = $.param(queryParams).replace(/\+/g, '%20');
      });
    }

    // Filter group URLs - dropdowns are for switching between tags
    var $filterConts = $('.filter--dropdown select', target);
    if($filterConts.length) {
      $filterConts.each(function(){
        var activeTag = $(this).find('option[selected]').data('custom');
        $(this).find('option').each(function(){
          var spl = $(this).val().split('/');
          var tags = spl[spl.length-1].split('+');
          var index = tags.indexOf(activeTag);
          if (index > -1) {
            tags.splice(index, 1);
          }
          spl.splice(spl.length-1, 1);
          var value = spl.join('/') + '/' + tags.join('+');
          $(this).attr('value', value);
        });
      });
    }

    // Masonry layout
    $(document).trigger('loadmasonry');


    // Infinite scroll (requires max one on page)
    if($('.pagination:not(.init-infiniscroll)', target).length == 1
        && $('.pagination:not(.init-infiniscroll) a.next', target).length > 0
        && $('.blocklayout.do-infinite', target).length == 1) {
      var $pager = $('.pagination', target).addClass('init-infiniscroll');
      var $moreBtn = $('<a href="'+$pager.find('a.next').attr('href')+'" class="infiniscroll" />').html("More products");
      $pager.empty().append($moreBtn);

      // Click to show more
      $pager.on('click', 'a.infiniscroll:not(.loading)', function(){
        $moreBtn.addClass('loading').html("Loading...");
        $.get($pager.find('a').attr('href'), function(data){
          var $data = $($.parseHTML(data));
          // isolate and hide new blocks
          var $newbies = $data.find('.blocklayout .block:not(.no-inf)');
          $newbies.addClass('initially-hidden');
          // Add to masonry, & reveal
          theme.MasonryManager.appendItems($newbies, $('.blocklayout'));
          $newbies.removeClass('initially-hidden');

          // Any more?
          var $next = $data.find('.pagination a.next');
          if($next.length == 0) {
            //We are out of products
            $pager.html('<span class="infiniscroll no-more">'+"No more products"+'</span>').fadeOut(5000);
          } else {
            //More to show
            $moreBtn.attr('href', $next.attr('href')).removeClass('loading').html("More products");
          }
          theme.reloadCurrency();
        });
        return false;
      });

      // Scroll event to trigger click
      $(window).on('scroll.infiniscroll', function(){
        var $pager = $('.pagination.init-infiniscroll');
        if($pager.length && $(window).scrollTop() + $(window).height() > $pager.offset().top) {
          $pager.find('a').trigger('click');
        }
      });

      theme.reloadCurrency();
    }
  }

  this.onSectionUnload = function(target){
    $('#sort-by', target).off('change');
    $('.blocklayout', target).masonry('destroy');
    $(window).off('scroll.infiniscroll')
  }
}

theme.ListCollectionsTemplateSection = new function(){
  this.onSectionLoad = function(target){
    // Masonry layout
    $(document).trigger('loadmasonry');
  }

  this.onSectionUnload = function(target){
    $('.blocklayout', target).masonry('destroy');
  }
}

theme.BlogTemplateSection = new function(){
  this.onSectionLoad = function(target){
    $(document).trigger('loadmasonry');
  }

  this.onSectionUnload = function(target){
    $('.blocklayout', target).masonry('destroy');
  }
}

// Manage option dropdowns
theme.productData = {};
theme.OptionManager = new function(){
  var _ = this;

  _._getVariantOptionElement = function(variant, $container) {
    return $container.find('select[name="id"] option[value="' + variant.id + '"]');
  };

  _.selectors = {
    container: '.product-container',
    gallery: '.product-gallery',
    priceArea: '.pricearea',
    submitButton: 'input[type=submit], button[type=submit]',
    multiOption: '.option-selectors'
  };

  _.strings = {
    priceNonExistent: "Unavailable",
    priceSoldOut: '[PRICE]',
    buttonDefault: "Add to cart",
    buttonNoStock: "Out of stock",
    buttonNoVariant: "Unavailable"
  };

  _._getString = function(key, variant){
    var string = _.strings[key];
    if(variant) {
      string = string.replace('[PRICE]', '<span class="theme-money">'+Shopify.formatMoney(variant.price, theme.money_format)+'</span>');
    }
    return string;
  }

  _.getProductData = function($form) {
    var productId = $form.data('product-id');
    var data = null;
    if(!theme.productData[productId]) {
      theme.productData[productId] = JSON.parse(document.getElementById('ProductJson-' + productId).innerHTML);
    }
    data = theme.productData[productId];
    if(!data) {
      console.log('Product data missing (id: '+$form.data('product-id')+')');
    }
    return data;
  }

  _.addVariantUrlToHistory = function(variant) {
    if(variant) {
      var newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?variant=' + variant.id;
      window.history.replaceState({path: newurl}, '', newurl);
    }
  }

  _.updateSku = function(variant, $container){
    $container.find('.sku .sku__value').html( variant ? variant.sku : '' );
    $container.find('.sku').toggleClass('sku--no-sku', !variant || !variant.sku);
  }

  _.updateBarcode = function(variant, $container){
    $container.find('.barcode .barcode__value').html( variant ? variant.barcode : '' );
    $container.find('.barcode').toggleClass('barcode--no-barcode', !variant || !variant.barcode);
  }

  _.updateBackorder = function(variant, $container){
    var $backorder = $container.find('.backorder');
    if($backorder.length) {
      if (variant && variant.available) {
        if (variant.inventory_management && _._getVariantOptionElement(variant, $container).data('stock') == 'out') {
          var productData = _.getProductData($backorder.closest('form'));
          $backorder.find('.selected-variant').html(productData.title + (variant.title.indexOf('Default') >= 0 ? '' : ' - '+variant.title) );
          $backorder.show();
        } else {
          $backorder.hide();
        }
      } else {
        $backorder.hide();
      }
    }
  }

  _.updatePrice = function(variant, $container) {
    var $priceArea = $container.find(_.selectors.priceArea);
    $priceArea.removeClass('on-sale');

    if(variant && variant.available == true) {
      var $newPriceArea = $('<div>');
      if(variant.compare_at_price > variant.price) {
        $('<span class="was-price theme-money">').html(Shopify.formatMoney(variant.compare_at_price, theme.money_format)).appendTo($newPriceArea);
        $newPriceArea.append(' ');
        $priceArea.addClass('on-sale');
      }
      $('<span class="current-price theme-money">').html(Shopify.formatMoney(variant.price, theme.money_format)).appendTo($newPriceArea);
      $priceArea.html($newPriceArea.html());
    } else {
      if(variant) {
        $priceArea.html(_._getString('priceSoldOut', variant));
      } else {
        $priceArea.html(_._getString('priceNonExistent', variant));
      }
    }
  }

  _._updateButtonText = function($button, string, variant) {
    $button.each(function(){
      var newVal;
      newVal = _._getString('button' + string, variant);
      if(newVal !== false) {
        if($(this).is('input')) {
          $(this).val(newVal);
        } else {
          $(this).html(newVal);
        }
      }
    });
  }

  _.updateButtons = function(variant, $container) {
    var $button = $container.find(_.selectors.submitButton);

    if(variant && variant.available == true) {
      $button.removeAttr('disabled');
      _._updateButtonText($button, 'Default', variant);
    } else {
      $button.attr('disabled', 'disabled');
      if(variant) {
        _._updateButtonText($button, 'NoStock', variant);
      } else {
        _._updateButtonText($button, 'NoVariant', variant);
      }
    }
  }

  _.updateContainerStatusClasses = function(variant, $container) {
    $container.toggleClass('variant-status--unavailable', !variant.available);
    $container.toggleClass('variant-status--backorder', variant.available
      && variant.inventory_management
      && _._getVariantOptionElement(variant, $container).data('stock') == 'out');
  }

  _.initProductOptions = function(originalSelect) {
    $(originalSelect).not('.theme-init').addClass('theme-init').each(function(){
      var $originalSelect = $(this);
      var productData = _.getProductData($originalSelect.closest('form'));

      // change state for original dropdown
      $originalSelect.on('change.themeProductOptions firstrun.themeProductOptions', function(e, variant){
        if($(this).is('input[type=radio]:not(:checked)')) {
          return; // handle radios - only update for checked
        }
        var variant = variant;
        if(!variant && variant !== false) {
          for(var i=0; i<productData.variants.length; i++) {
            if(productData.variants[i].id == $(this).val()) {
              variant = productData.variants[i];
            }
          }
        }
        var $container = $(this).closest(_.selectors.container);

        // update price
        _.updatePrice(variant, $container);

        // update buttons
        _.updateButtons(variant, $container);

        // variant images
        if (variant && variant.featured_image) {
          $container.find(_.selectors.gallery).trigger('variantImageSelected', variant);
        }

        // extra details
        _.updateBarcode(variant, $container);
        _.updateSku(variant, $container);
        _.updateBackorder(variant, $container);
        _.updateContainerStatusClasses(variant, $container);

        // variant urls
        var $form = $(this).closest('form');
        if($form.data('enable-history-state') && e.type == 'change') {
          _.addVariantUrlToHistory(variant);
        }

        // multi-currency
        if(typeof Currency != 'undefined' && typeof Currency.convertAll != 'undefined' && $('[name=currencies]').length) {
          theme.reloadCurrency();
          $('.selected-currency').text(Currency.currentCurrency);
        }
      });

      // split-options wrapper
      $originalSelect.closest(_.selectors.container).find(_.selectors.multiOption).on('change.themeProductOptions', 'select', function(){
        var selectedOptions = [];
        $(this).closest(_.selectors.multiOption).find('select').each(function(){
          selectedOptions.push($(this).val());
        });
        // find variant
        var variant = false;
        for(var i=0; i<productData.variants.length; i++) {
          var v = productData.variants[i];
          var matchCount = 0;
          for(var j=0; j<selectedOptions.length; j++) {
            if(v.options[j] == selectedOptions[j]) {
              matchCount++;
            }
          }
          if(matchCount == selectedOptions.length) {
            variant = v;
            break;
          }
        }
        // trigger change
        if(variant) {
          $originalSelect.val(variant.id);
        }
        $originalSelect.trigger('change', variant);
      });

      // first-run
      $originalSelect.trigger('firstrun');
    });
  }

  _.unloadProductOptions = function(originalSelect) {
    $(originalSelect).each(function(){
      $(this).off('.themeProductOptions');
      $(this).closest(_.selectors.container).find(_.selectors.multiOption).off('.themeProductOptions');
    });
  }
};

/// Footer position
theme.repositionFooter = function(){
  var $preFooterContent = $('#content');
  var $footer = $('.page-footer');
  var offset = $(window).height() - ($preFooterContent.offset().top + $preFooterContent.outerHeight()) - $footer.outerHeight();
  $footer.css('margin-top', offset > 0 ? offset : '');
};

/// Text that scales based on column width
theme.resizeScalingTextFromColumn = function() {
  $('.scaled-text').each(function(){
    var $base = $(this).closest('.scaled-text-base');
    var scale = $base.width() / 1200;
    $(this).css('font-size', (scale * 100) + '%');
  });
}

//Function to show a quick generic text popup above an element
theme.showQuickPopup = function(message, $origin){
  var $popup = $('<div>').addClass('simple-popup hidden');
  var offs = $origin.offset();
  $('body').append($popup);
  $popup.html(message).css({ 'left':offs.left - ($popup.outerWidth() - $origin.outerWidth()), 'top':offs.top });
  $popup.css('margin-top', - $popup.outerHeight() - 10).removeClass('hidden');
  setTimeout(function(){
    $popup.addClass('hidden');
    setTimeout(function(){
      $popup.remove();
    }, 500);
  }, 4000);
}

// Reload multi-currency
theme.reloadCurrency = function() {
  
}

theme.MasonryManager = new function(){
  var _ = this;
  _.getInitialisedMasonry = function() {
    return $('.blocklayout').filter(function(){
      return !!$(this).data('masonry');
    });
  }

  _.remasonry = function(){
    var w = _.setBlockWidths();
    var $masonries = _.getInitialisedMasonry();

    // limit to number of visible rows
    var perRow = Math.round($masonries.first().width() / w);
    $masonries.filter('[data-row-limit]:not([data-row-limit=""])').each(function(){
      var limit = $(this).data('row-limit') * perRow;
      $(this).children().each(function(index){
        $(this).toggleClass('hidden', index >= limit);
      });
    });

    _.setFixedSizes();

    $masonries.masonry({
      columnWidth: w
    });
  }

  _.setFixedSizes = function(){
    _.getInitialisedMasonry().each(function(){
      var $fixed = $(this).children('.fixed-ratio:not(.hidden):not(.size-large)');
      if($fixed.length > 0) {
        var h = -1;
        $fixed.each(function(i){
          var $lastChild = $(this).children().last();
          h = Math.max(h, $lastChild.position().top + $lastChild.outerHeight(true));
        });
        $fixed.css('height', h);
      }
    });
  }
  _.getUnInitialisedMasonry = function() {
    return $('.blocklayout').filter(function(){
      return !$(this).data('masonry');
    });
  }

  _.getBlockMargin = function($masonry) {
    var $firstBlock = $masonry.find('.block:first');
    return $firstBlock.length ? parseInt($firstBlock.css('margin-left')) : 15;
  }

  _.columnWidth = function($masonry) {
    var baseWidth = 250;
    if(typeof $masonry.data('block-width') !== 'undefined') {
      baseWidth = parseInt($masonry.data('block-width'));
    }
    var defWidth = baseWidth * ($masonry.hasClass('double-sized')?2:1) + _.getBlockMargin($masonry) * 2;
    var cols = Math.ceil(($masonry.width() - 200) / defWidth);

    //Min two per row on mobile (delete to go 1-a-row)
    var isProductGrid = $masonry.find('.block:not(.product)').length == 0;
    if(isProductGrid && $(window).width() < 768) {
      cols = Math.max(2, cols);
    }

    return Math.floor($masonry.width() / cols);
  }

  _.setBlockWidths = function() {
    var colWidth = 0;
    $('.blocklayout').each(function(){
      var $masonry = $(this);
      colWidth = _.columnWidth($masonry);
      var marginWidth = _.getBlockMargin($masonry) * 2;
      $masonry.children(':not(.size-large)').css('width', colWidth - marginWidth);
      if($(window).width() < colWidth*2 + marginWidth*2) {
        $masonry.children('.size-large').css('width', colWidth - marginWidth);
      } else {
        $masonry.children('.size-large').css('width', colWidth * 2 - marginWidth);
      }
    });
    return colWidth;
  }

  _.appendItems = function($items, $masonryContainer) {
    $masonryContainer.append($items);
    _.setBlockWidths();
    _.setFixedSizes();
    $masonryContainer.masonry('appended', $items);
  }
}


$(function($){
  $(document).on('variantImageSelected', '.product-gallery', function(e, variant){
    var $swiperImgLinks = $('.swiper-container:first .swiper-slide a', this);
    var swiper = $('.swiper-container:first', this).data('swiper');
    if(swiper) {
      var toMatch = variant.featured_image.src.replace(/http[s]+:/, '').split('?')[0];
      var $match = $swiperImgLinks.filter(function(){
        return $(this).data('full-size-src').split('?')[0] == toMatch;
      }).first();

      if($match.length) {
        swiper.slideTo($match.parent().index());
      }
    }
  });

  //First masonry load
  $(document).on('loadmasonry', function(){
    theme.MasonryManager.getUnInitialisedMasonry().each(function(){
      var $masonry = $(this);
      $masonry.masonry({
        isResizeBound: false,
        itemSelector : '.block',
        columnWidth: theme.MasonryManager.setBlockWidths(),
        isLayoutInstant: true, //Built-in transforms are buggy, using CSS instead
        isAnimated: !Modernizr.csstransitions
      });

      setTimeout(function(){
        theme.MasonryManager.remasonry();
        // pagination hidden until products loaded, on collections
        $('.hidden-pagination').removeClass('hidden');
        // layout has changed
        theme.repositionFooter();
      }, 10);
    });
  }).trigger('loadmasonry');

  //Re-up the masonry after fonts are loaded, or on resize
  $(window).on('load debouncedresize', theme.MasonryManager.remasonry);

  /// Redirect dropdowns
  $(document).on('change', 'select.navdrop', function(){
    window.location = $(this).val();
  });

  /// General purpose lightbox
  $('a[rel="fancybox"]').fancybox({ titleShow: false });

  /// Main nav

  // Inside mode: Click top level item
  $(document).on('click', '.nav-style-in .mainnav .tier1 > ul > li > a, .show-nav-mobile .mainnav .tier1 > ul > li > a', function(e){
    if($(this).siblings('div').length) {
      e.preventDefault();
      var $this = $(this);
      // store scroll position
      var panelScroll = $('#navpanel').scrollTop();
      $('#navpanel').data('lastScroll', panelScroll);
      // scroll to top
      $('#navpanel').animate({ scrollTop: 0 }, panelScroll > 0 ? 250 : 0, function(){
        // transition
        $this.parent().addClass('expanded');
        var $tier1 = $this.closest('.tier1').addClass('inside-expanded-tier2');
        // a11y
        $this.attr('aria-expanded', 'true');
        $this.siblings('.tier2').attr('id', 'current-submenu');
        $('.mainnav .back').removeAttr('tabindex');
        // show back button
        setTimeout(function(){
          $tier1.addClass('showback');
        }, 250);
      });
    }
  });

  // Inside mode: Go back up
  $(document).on('click', '#navpanel .mainnav .back', function(e){
    e.preventDefault();
    // hide back button
    var $tier1 = $(this).closest('.tier1').removeClass('showback');

    // a11y
    $tier1.find('[aria-expanded]').attr('aria-expanded', 'false');
    $('.mainnav .back').attr('tabindex', '-1');
    $('#current-submenu').removeAttr('id');

    // scroll
    var lastScroll = $('#navpanel').data('lastScroll');
    var panelScroll = $('#navpanel').scrollTop();
    if(typeof lastScroll != 'undefined') {
      $('#navpanel').animate({ scrollTop: lastScroll + 'px' }, lastScroll != panelScroll ? 250 : 0);
    }

    // transition
    setTimeout(function(){
      $tier1.removeClass('inside-expanded-tier2');
      // after transition
      setTimeout(function(){
        $tier1.find('.expanded').removeClass('expanded');
      }, 260);
    }, 210);
  });


  // Flyout mode: Hover over nav
  var navHoverRemoveTimeoutId = -1;
  $(document).on('mouseenter mouseleave', 'body:not(.show-nav-mobile) .nav-style-out #navpanel .mainnav .tier1 > ul > li', function(e){
    if($(this).children('div').length) {
      e.preventDefault();
      var doShow = e.type == 'mouseenter';
      var w = $('#content').width();
      var $thisLi = $(this);
      clearTimeout(navHoverRemoveTimeoutId);
      if(doShow) {
        // clear existing visible items
        var $existing = $('.mainnav .outside-expanded').removeClass('outside-expanded');

        // prepare to show
        if(!$('body').hasClass('nav-outside-expanded-mode')) {
          $('body').addClass('nav-outside-expanded-mode');
          $('.bodywrap, .page-header').css('margin-right', $('#content').width() - w); // cater for scrollbar
        }
        $thisLi.find('.tier2 .tier-title').css('margin-top', $('#navpanel .shoplogo').outerHeight());

        // show (after reflow caused by css changes)
        $('body').addClass('nav-outside-expanded-show');
        $thisLi.addClass('outside-expanded');
        $thisLi.children('a').attr('aria-expanded', 'true');

      } else {
        // hide, after small delay
        $thisLi.children('a').attr('aria-expanded', 'false');
        navHoverRemoveTimeoutId = setTimeout(function(){
          $('body').removeClass('nav-outside-expanded-show');
          $thisLi.removeClass('outside-expanded');

          navHoverRemoveTimeoutId = setTimeout(function(){
            // remove hover mode & scrollbar margin
            $('body').removeClass('nav-outside-expanded-mode');
            $('.mainnav .tier2 .tier-title').css('margin-top', '');
            $('.bodywrap, .page-header').css('margin-right', '');
          }, 260); //post trans
        }, 500);
      }
    }
  });

  // Tier 3 expansion
  $(document).on('click', '.tier2 > ul > li > a', function(e){
    var $sib = $(this).siblings('ul');
    if($sib.length) {
      e.preventDefault();
      if($sib.is(':visible')) {
        $sib.slideUp(250);
        $(this).attr('aria-expanded', 'false').parent().removeClass('expanded');
      } else {
        $sib.slideDown(250);
        $(this).attr('aria-expanded', 'true').parent().addClass('expanded');
      }
    }
  });

  // Mobile nav visibility
  $(document).on('click', '.nav-toggle', function(e){
    e.preventDefault();
    $('body').toggleClass('show-nav-mobile');
  });
  $(document).on('click touchend', 'body.show-nav-mobile', function(e){
    if(e.target == this) {
      $(this).removeClass('show-nav-mobile');
      return false;
    }
  });



  //AJAX add to cart
  var shopifyAjaxAddURL = '/cart/add.js';
  var shopifyAjaxStorePageURL = '/search';
  $(document).on('submit', 'form[action^="/cart/add"][data-ajax="true"]', function(e) {
    var $form = $(this);
    //Disable add button
    $form.find('button[type="submit"]').attr('disabled', 'disabled').html("Adding...");

    // Add to cart
    $.post(shopifyAjaxAddURL, $form.serialize(), function(data) {
      // Enable add button
      var $btn = $form.find('button[type="submit"]').removeAttr('disabled');

      // Show added message
      $btn.html(theme.icons.tick + ' ' + "Added to cart");

      // Back to default button text
      setTimeout(function(){
        $btn.html("Add to cart");
      }, 3000);

      // Added, show CTA
      if($btn.next('.added-cta').length == 0) {
        var $cta = $('<a href="/cart"></a>');
        $cta.append($('<span class="beside-img">').html("Go to cart"));
        $cta.append(' ').append(theme.icons.chevronRight);
        $cta = $cta.wrap('<div class="added-cta">').parent().hide().insertAfter($btn);
        $cta.slideDown(500, function(){
          $(this).addClass('show');
          // resize lightbox, if in quick-buy
          if($btn.closest('#fancybox-content').length) {
            $.fancybox.resize();
          }
        });
      }

      // Update header
      $.get(shopifyAjaxStorePageURL, function(data){
        var $newCartObj = $(data).find('.page-header .cartsummary');
        var $currCart = $('.page-header .cartsummary');
        $currCart.html($newCartObj.html());

        
      });
    }, 'text').error(function(data) {
      // Enable add button
      $form.find('button[type="submit"]').removeAttr('disabled').html("Add to cart");

      // Not added, show message
      if(typeof(data) != 'undefined' && typeof(data.status) != 'undefined') {
        var jsonRes = $.parseJSON(data.responseText);
        theme.showQuickPopup(jsonRes.description, $form.find('button[type="submit"]:first'));
      } else {
        //Some unknown error? Disable ajax and add the old-fashioned way.
        $form.addClass('noAJAX');
        $form.submit();
      }
    });
    return false;
  });


  /// Quick buy popup
  $(document).on('click', '.block.product .quick-buy', function(){
    var productSelector = '.product:not(.insert)';
    var $prod = $(this).closest(productSelector);
    var prevIndex = $prod.index(productSelector) - 1;
    var nextIndex = $prod.index(productSelector) + 1;
    if(nextIndex > $prod.siblings(productSelector).length) {
      nextIndex = -1;
    }

    $.fancybox.showActivity();

    $.get($(this).attr('href'), function(data){
      var $template = $('<div class="quickbuy-form">').append(data);
      $.fancybox({
        padding: 0,
        showCloseButton: false,
        content: $($template.wrap('<div>').parent().html()).prepend(
          ['<div class="action-icons">',
            '<a href="#" class="prev-item action-icon" data-idx="',prevIndex,'">', theme.icons.left, '</a>',
            '<a href="#" class="next-item action-icon" data-idx="',nextIndex,'">', theme.icons.right, '</a>',
            '<a href="#" class="close-box action-icon">', theme.icons.close, '</a>',
            '</div>'].join('')
        ),
        onComplete: function(){
          theme.reloadCurrency();

          // init product form, if required
          theme.OptionManager.initProductOptions($('.quickbuy-form select[name=id]'));

          $(document).on('shopify:payment_button:loaded.themeQuickBuy', function(){
            $(document).off('shopify:payment_button:loaded.themeQuickBuy');
            $.fancybox.resize();
          });
          Shopify.PaymentButton.init();

          // gallery
          $('.quickbuy-form .product-gallery').trigger('initProductGallery');
        }
      });
    });

    return false;
  });
  $(document).on('click', '.quickbuy-form .close-box', function(){
    $.fancybox.close();
    return false;
  }).on('click', '.quickbuy-form .prev-item, .quickbuy-form .next-item', function(){
    $($('.block.product:not(.insert)').get($(this).data('idx'))).find('.quick-buy').click();
    return false;
  });

  // lightbox on click
  $(document).on('click', '.product-gallery .gallery-top a', function(e){
    e.preventDefault();
    if($(this).closest('.quickbuy-form').length == 0) {
      var $gall = $(this).closest('.product-gallery');
      if($('.gallery-top .swiper-slide', $gall).length > 1) {
        var imgs = Array();
        var srcToShow = $(this).attr('href');
        var indexToShow = 0;
        $('.gallery-top .swiper-slide a', $gall).each(function(index){
          imgs.push({
            href: $(this).attr('href')
          });
          if($(this).attr('href') == srcToShow) {
            indexToShow = index;
          }
        });
        $.fancybox(imgs, { index: indexToShow, padding: 0 });
      } else {
        $.fancybox([{href: $(this).attr('href')}], { padding: 0 });
      }
    }
  });


  $(window).on('load debouncedresize', theme.resizeScalingTextFromColumn);

  /// Terms requirement on cart
  $(document).on('click', '#cartform[data-require-terms="true"] #update-cart, #cartform[data-require-terms="true"] .additional-checkout-buttons a, #cartform[data-require-terms="true"] .additional-checkout-buttons input', function() {
    var $form = $(this).closest('form');
    if($form.has('#terms') && $form.find('#terms:checked').length == 0) {
      alert("You must agree to the terms and conditions before continuing.");
      return false;
    }
  });

  /// Assess footer position on ready/load/resize
  theme.repositionFooter();
  $(window).on('load debouncedresize', theme.repositionFooter);

  /// Product gallery
  $(document).on('initProductGallery', '.product-gallery:not(.product-gallery--init)', function(){
    $(this).addClass('product-gallery--init');

    var $swiper = $('.swiper-container', this);
    // if multiple slides
    if($swiper.find('.swiper-slide').length > 1) {
      var initial = 0;
      var $feat = $swiper.find('.swiper-slide[data-featured="true"]');
      if($feat.length) {
        initial = $feat.index();
      }
      var galleryTop = new Swiper($swiper, {
        nextButton: $swiper.find('.swiper-button-next'),
        prevButton: $swiper.find('.swiper-button-prev'),
        slidesPerView: 'auto',
        spaceBetween: 10,
        speed: 500,
        autoHeight: $(window).width() < 768, // if true, adjusts the height of the gallery to match the current image
        initialSlide: initial
      });
      galleryTop.slideTo(initial, 0);

      // gallery control
      $(this).on('click', 'a', function(e){
        e.preventDefault();
        galleryTop.slideTo($(this).index());
      });
    }
  });

  /// Tag filtering area
  $(document).on('click', '.filter-group .filter-toggle', function(e){
    e.preventDefault();
    var $group = $(this).closest('.filter-group');
    if($group.toggleClass('filter-group--show').hasClass('filter-group--show')) {
      $group.find('.filter-items').slideDown();
    } else {
      $group.find('.filter-items').slideUp();
    }
  });

  /// Custom share buttons
  $(document).on('click', '.sharing a', function(e){
    var $parent = $(this).parent();
    if($parent.hasClass('twitter')) {
      e.preventDefault();
      var url = $(this).attr('href');
      var width  = 575,
          height = 450,
          left   = ($(window).width()  - width)  / 2,
          top    = ($(window).height() - height) / 2,
          opts   = 'status=1, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0' +
          ',width='  + width  +
          ',height=' + height +
          ',top='    + top    +
          ',left='   + left;
      window.open(url, 'Twitter', opts);

    } else if($parent.hasClass('facebook')) {
      e.preventDefault();
      var url = $(this).attr('href');
      var width  = 626,
          height = 256,
          left   = ($(window).width()  - width)  / 2,
          top    = ($(window).height() - height) / 2,
          opts   = 'status=1, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0' +
          ',width='  + width  +
          ',height=' + height +
          ',top='    + top    +
          ',left='   + left;
      window.open(url, 'Facebook', opts);

    } else if($parent.hasClass('pinterest')) {
      e.preventDefault();
      var url = $(this).attr('href');
      var width  = 700,
          height = 550,
          left   = ($(window).width()  - width)  / 2,
          top    = ($(window).height() - height) / 2,
          opts   = 'status=1, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0' +
          ',width='  + width  +
          ',height=' + height +
          ',top='    + top    +
          ',left='   + left;
      window.open(url, 'Pinterest', opts);

    } else if($parent.hasClass('google')) {
      e.preventDefault();
      var url = $(this).attr('href');
      var width  = 550,
          height = 450,
          left   = ($(window).width()  - width)  / 2,
          top    = ($(window).height() - height) / 2,
          opts   = 'status=1, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0' +
          ',width='  + width  +
          ',height=' + height +
          ',top='    + top    +
          ',left='   + left;
      window.open(url, 'Google+', opts);

    }
  });

  /// Register all sections
  theme.Sections.init();
  theme.Sections.register('header-section', theme.HeaderSection);
  theme.Sections.register('footer-section', theme.FooterSection);
  theme.Sections.register('slideshow', theme.SlideshowSection);
  theme.Sections.register('image-with-text-overlay', theme.ImageWithTextOverlay);
  theme.Sections.register('instagram', theme.InstagramSection);
  theme.Sections.register('video', theme.VideoManager);
  theme.Sections.register('map', theme.MapSection);
  theme.Sections.register('custom-row', theme.CustomRowSection);
  theme.Sections.register('featured-product', theme.FeaturedProduct);
  theme.Sections.register('featured-collection', theme.FeaturedCollectionSection);
  theme.Sections.register('featured-collections', theme.FeaturedCollectionsSection);
  theme.Sections.register('collection-template', theme.CollectionTemplateSection);
  theme.Sections.register('list-collections-template', theme.ListCollectionsTemplateSection);
  theme.Sections.register('blog-template', theme.BlogTemplateSection);
  theme.Sections.register('product-template', theme.ProductTemplateSection);
  theme.Sections.register('cart-template', theme.CartTemplateSection);
  theme.Sections.register('nested-sections', theme.NestedSectionsSection);
});

})(theme.jQuery);
