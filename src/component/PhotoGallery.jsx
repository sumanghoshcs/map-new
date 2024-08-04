
const PhotoGallery = ({ photos }) => {
    if (!photos || photos.length === 0) return null;
  
    return (
      <div className="photo-gallery">
        {photos.map((photo) => (
          <div key={photo.id} className="photo-item">
            <img src={photo.urls.small} alt={photo.alt_description} />
            <p>{photo.description || "No description"}</p>
          </div>
        ))}
      </div>
    );
  };

  export default PhotoGallery;