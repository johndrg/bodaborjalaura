document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll
  document.getElementById('scroll-down').addEventListener('click', () => {
    const section = document.querySelector('.section');
    window.scrollTo({
      top: section.offsetTop,
      behavior: 'smooth'
    });
  });

  // Sistema optimizado para galería dinámica
  const galleryContainer = document.getElementById('gallery-container');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const modal = document.getElementById('photo-modal');
  const modalImg = document.getElementById('modal-img');
  const modalSpinner = document.getElementById('modal-spinner');
  const modalCounter = document.getElementById('modal-counter');
  const closeModal = document.getElementById('close-modal');
  const prevBtn = document.getElementById('prev-photo');
  const nextBtn = document.getElementById('next-photo');
  const bonusForm = document.getElementById('bonus-form');
  const bonusAnswer = document.getElementById('bonus-answer');
  const bonusResult = document.getElementById('bonus-result');

  let currentIndex = 0;
  let images = [];
  let imageLoaded = false;

  function getCSSVariable(variableName) {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  }

  const resizeGridItems = () => {
    // Valor base uniforme
    const rowHeight = 15; // IMPORTANTE: Debe coincidir con grid-auto-rows en CSS
    const rowGap = 10;    // IMPORTANTE: Debe coincidir con grid-gap en CSS

    galleryItems.forEach(item => {
      const imgElement = item.querySelector('img');
      if (!imgElement) return;

      // Para evitar cálculos antes de que la imagen esté cargada
      if (imgElement.complete) {
        calculateSpan(item, imgElement);
      } else {
        imgElement.addEventListener('load', () => calculateSpan(item, imgElement));
      }
    });

    function calculateSpan(item, imgElement) {
      // Obtener dimensiones reales
      const height = imgElement.getBoundingClientRect().height;
      // Calcular spans necesarios (añadir el gap)
      const rowSpan = Math.ceil((height + rowGap) / (rowHeight + rowGap));
      // Establecer variable CSS personalizada
      item.style.setProperty('--row-span', rowSpan);
      // Aplicar el span
      item.style.gridRowEnd = `span ${rowSpan}`;
    }
  };




  // Manejo de carga de imágenes y reajuste de grid
  const handleImagesLoaded = () => {
    let loadedCount = 0;
    const totalImages = galleryItems.length;

    const onAllLoaded = () => {
      // Ejecutar resize después de un pequeño retraso para asegurar renderizado
      setTimeout(resizeGridItems, 50);
      // Volver a recalcular después de un tiempo mayor para mayor seguridad
      setTimeout(resizeGridItems, 500);
    };

    galleryItems.forEach(item => {
      const img = item.querySelector('img');

      if (!img) {
        loadedCount++;
        if (loadedCount === totalImages) onAllLoaded();
        return;
      }

      if (img.complete) {
        item.classList.add('loaded');
        loadedCount++;
        if (loadedCount === totalImages) onAllLoaded();
      } else {
        img.addEventListener('load', () => {
          item.classList.add('loaded');
          loadedCount++;
          if (loadedCount === totalImages) onAllLoaded();
        });
      }
    });
  };


  // Inicializar colección de imágenes
  const initializeGallery = () => {
    galleryItems.forEach((item, index) => {
      const img = item.querySelector('img');
      images.push({
        src: img.src,
        alt: img.alt || `Foto ${index + 1}`
      });

      // Abrir modal al hacer clic
      item.addEventListener('click', () => openModal(index));
    });

    // Actualizar contador inicial
    updateCounter();

    // Manejar carga de imágenes para masonry
    handleImagesLoaded();
  };

  // Abrir modal con imagen específica
  const openModal = (index) => {
    currentIndex = index;
    imageLoaded = false;

    // Mostrar spinner y ocultar imagen hasta que cargue
    modalSpinner.style.display = 'block';
    modalImg.classList.remove('loaded');

    // Establecer nueva imagen
    modalImg.src = images[currentIndex].src;
    modalImg.alt = images[currentIndex].alt;

    // Actualizar contador
    updateCounter();

    // Mostrar modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  // Actualizar contador
  const updateCounter = () => {
    modalCounter.textContent = `${currentIndex + 1}/${images.length}`;
  };

  // Navegar entre imágenes
  const navigateGallery = (direction) => {
    imageLoaded = false;
    modalSpinner.style.display = 'block';
    modalImg.classList.remove('loaded');

    // Calcular nuevo índice
    if (direction === 'next') {
      currentIndex = (currentIndex + 1) % images.length;
    } else {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
    }

    // Cargar nueva imagen
    modalImg.src = images[currentIndex].src;
    modalImg.alt = images[currentIndex].alt;

    // Actualizar contador
    updateCounter();
  };

  // Event listener para carga de imagen en modal
  modalImg.addEventListener('load', () => {
    modalSpinner.style.display = 'none';
    modalImg.classList.add('loaded');
    imageLoaded = true;
  });

  // Cerrar modal
  closeModal.addEventListener('click', () => {
    modal.classList.remove('active');
    setTimeout(() => {
      document.body.style.overflow = 'auto';
    }, 300);
  });

  // Navegación con botones
  prevBtn.addEventListener('click', () => navigateGallery('prev'));
  nextBtn.addEventListener('click', () => navigateGallery('next'));

  // Cerrar modal haciendo clic fuera
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.classList.remove('active');
      setTimeout(() => {
        document.body.style.overflow = 'auto';
      }, 300);
    }
  });

  // Navegación con teclado
  document.addEventListener('keydown', (event) => {
    if (!modal.classList.contains('active')) return;

    if (event.key === 'Escape') {
      modal.classList.remove('active');
      setTimeout(() => {
        document.body.style.overflow = 'auto';
      }, 300);
    } else if (event.key === 'ArrowLeft') {
      navigateGallery('prev');
    } else if (event.key === 'ArrowRight') {
      navigateGallery('next');
    }
  });

  window.addEventListener('load', () => {
    handleImagesLoaded();
    // Asegurar que las imágenes cargadas tardíamente también se procesen
    setTimeout(resizeGridItems, 1000);
  });

  // Recalcular layout en resize
  window.addEventListener('resize', debounce(resizeGridItems, 150));

  // Función debounce para optimizar eventos de resize
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    }; // Corregido: llave de cierre alineada correctamente
  }

  // Método para añadir nuevas imágenes dinámicamente (preparado para futura expansión)
  window.addGalleryImage = (src, alt = '') => {
    // Crear nuevo elemento
    const newItem = document.createElement('div');
    newItem.className = 'gallery-item';

    const newImg = document.createElement('img');
    newImg.src = src;
    newImg.alt = alt || `Foto ${images.length + 1}`;
    newImg.className = 'gallery-img';
    newImg.setAttribute('loading', 'lazy');

    newItem.appendChild(newImg);
    galleryContainer.appendChild(newItem);

    // Añadir a la colección
    images.push({
      src: src,
      alt: alt || `Foto ${images.length + 1}`
    });

    // Configurar evento de clic
    newItem.addEventListener('click', () => openModal(images.length - 1));

    // Manejar carga para masonry
    newImg.addEventListener('load', () => {
      newItem.classList.add('loaded');
      // Actualizar el divisor a 15 aquí también
      const rowSpan = Math.ceil((newImg.clientHeight + 15) / 15);
      newItem.style.setProperty('--row-span', rowSpan);
    });

    // Actualizar contadores
    updateCounter();

    return images.length - 1; // Devolver índice de la nueva imagen
  };

  // Este array contiene las palabras cifradas (calculadas usando la función de arriba)
  const encryptedAnswers = [
    'a3hoeXI=', 'a3hoeXJ2', 'ZnJtcnFodg==', 'aWRuaA=='
  ];

  // Array de respuestas directas (añadido para corregir la referencia que faltaba)
  const acceptedAnswers = [
    'photoshop', 'fake', 'falsa', 'montaje', 'editada', 'trucada', 'modificada'
  ];

  // Función para descifrar respuestas
  function decryptWord(encrypted) {
    try {
      return atob(encrypted).split('').map(char =>
        String.fromCharCode(char.charCodeAt(0) - 3)
      ).join('');
    } catch (e) {
      console.error('Error al descifrar:', e);
      return '';
    }
  }

  // Check bonus answer
    if (bonusForm) {
      // Inicializar contador de intentos
      let failedAttempts = 0;
      const bonusHint = document.querySelector('.bonus-hint');

      bonusForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const answer = bonusAnswer.value.trim().toLowerCase();
        let isCorrect = false;

        // Comparar con respuestas desencriptadas
        for (let i = 0; i < encryptedAnswers.length; i++) {
          const decryptedAnswer = decryptWord(encryptedAnswers[i]);
          if (answer.includes(decryptedAnswer)) {
            isCorrect = true;
            break;
          }
        }

        // También verificar con las respuestas directas para mayor seguridad
        if (!isCorrect) {
          isCorrect = acceptedAnswers.some(validAnswer =>
            answer.includes(validAnswer)
          );
        }

        if (isCorrect) {
          // Resetear contador si la respuesta es correcta
          failedAttempts = 0;
          bonusResult.classList.add('revealed');

          // En lugar de desplazarse, hacer que el contenido sea visible sin desplazamiento
          bonusResult.style.display = 'block';

          // Añadir una animación de atención para que el usuario note el contenido nuevo
          setTimeout(() => {
            bonusResult.classList.add('highlight-animation');
          }, 400);

          // [Resto del código existente para manejo de respuesta correcta...]
        } else {
          // Incrementar contador de intentos fallidos
          failedAttempts++;

          // Mostrar la pista después de 3 intentos fallidos
          if (failedAttempts >= 5 && bonusHint) {
            bonusHint.classList.add('visible');
          }

          // Animación de error (código existente)
          bonusAnswer.classList.add('shake');
          setTimeout(() => {
            bonusAnswer.classList.remove('shake');
          }, 500);
        }
      });
    }

  // Hacer que la imagen del bonus sea clickeable para verla en el modal
  const bonusImage = document.querySelector('.bonus-image');
  if (bonusImage) {
    bonusImage.addEventListener('click', () => {
      if (!images.some(img => img.src === bonusImage.src)) {
        images.push({
          src: bonusImage.src,
          alt: 'Imagen bonus'
        });
      }
      currentIndex = images.findIndex(img => img.src === bonusImage.src);
      if (currentIndex >= 0) {
        modalImg.src = images[currentIndex].src;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  }

  // Inicializar la galería al cargar
  initializeGallery();

  // Evento para mostrar/ocultar el contenido bonus
  const bonusButton = document.getElementById('bonus-button');
  const bonusContent = document.getElementById('bonus-content');

  if (bonusButton && bonusContent) {
    bonusButton.addEventListener('click', () => {
      bonusContent.classList.toggle('revealed');
    });
  }

  // Iniciador para puzzle
  const checkAnswersBtn = document.getElementById('check-answers-btn');
  const puzzleQuestions = document.querySelectorAll('.puzzle-question');
  const puzzleSuccess = document.getElementById('puzzle-success');
  const puzzleFailure = document.getElementById('puzzle-failure');
  const secretGallery = document.getElementById('secret-gallery');

  if (checkAnswersBtn) {
    checkAnswersBtn.addEventListener('click', () => {
      let allCorrect = true;

      puzzleQuestions.forEach(question => {
        const correctIndex = question.getAttribute('data-correct');
        const selectedOption = question.querySelector('.question-option.selected');

        if (!selectedOption || selectedOption.getAttribute('data-index') !== correctIndex) {
          question.classList.add('incorrect');
          question.classList.remove('correct');
          allCorrect = false;
        } else {
          question.classList.add('correct');
          question.classList.remove('incorrect');
        }
      });

      if (allCorrect) {
        puzzleSuccess.style.display = 'block';
        puzzleFailure.style.display = 'none';
        secretGallery.classList.add('revealed');
      } else {
        puzzleSuccess.style.display = 'none';
        puzzleFailure.style.display = 'block';
      }
    });

    // Añadir event listener para las opciones de preguntas
    document.querySelectorAll('.question-option').forEach(option => {
      option.addEventListener('click', () => {
        // Desseleccionar todas las opciones de esta pregunta
        const question = option.closest('.puzzle-question');
        question.querySelectorAll('.question-option').forEach(opt => {
          opt.classList.remove('selected');
        });

        // Seleccionar esta opción
        option.classList.add('selected');
      });
    });
  }
});