import numpy as np
import io
import os
import logging
from matplotlib import pyplot as plt
import csv
import matplotlib.animation as anim
import tempfile
import tifffile as tiff
from PIL import Image

logger = logging.getLogger(__name__)

def conf_raw(img, file):
    # NOTE: As mentioned above, this datatype should be an auto generated field
    # in the adv image upload form for RAW files. The image parameters for
    # slices, width, height should be converted to ints
    # NOTE: If an 8-bit raw comes through, we need to set the datatype for that to unsigned.

    logger.info(f'img: {img}')

    prefix_map = {'little_endian': '<', 'big_endian': '>'}
    suffix_map = {
        '8_bit': 'u1', '16_bit_unsigned': 'u2', '32_bit_unsigned': 'u4', '64_bit_unsigned': 'u8',
        '8_bit_signed': 'i1', '16_bit_signed': 'i2', '32_bit_signed': 'i4', '64_bit_signed': 'i8',
        '32_bit_real': 'f4', '64_bit_real': 'f8'
    }

    prefix = prefix_map.get(img['byte_order'], '|')  # Default to native byte order if unknown
    suffix = suffix_map.get(img['image_type'])
    datatype = prefix + suffix

    file_data = np.frombuffer(file, dtype=datatype)
    return file_data.reshape([
        int(img['number_of_images']),
        int(img['height']),
        int(img['width'])
    ])

def conf_tiff(file):
    with io.BytesIO(file) as buffer:
        image = tiff.imread(buffer)
    return image

def binary_correction(img):
    logger.debug('Correcting for Binary values...')
    min_value = np.min(img)
    max_value = np.max(img)
    k=255/(max_value-min_value)
    l=-k*min_value

    image1=np.floor(img * k + l)
    del img
    return image1.astype('uint8')

def create_thumbnail(img):    
    dpi = 100
    dim_max = 5
    width = img.shape[1]
    height = img.shape[0]
    depth_slice = None
    if len(img.shape) == 3 and 3 not in img.shape:
        width = img.shape[2]
        height = img.shape[1]
        depth_slice = int(np.ceil(img.shape[0]/2))
    elif len(img.shape) == 3 and 3 in img.shape:
        # TODO: Handle RGB files shape ==> (h, w, 3)
        logger.debug('handle RGB')

    # preserve aspect ratio and resize to fit.
    modifier = dim_max/width if width>height else dim_max/height
    resized_width = width*modifier
    resized_height = height*modifier

    fig = plt.figure()
    fig.set_size_inches(resized_width, resized_height, dpi)
    ax = plt.Axes(fig, [0., 0., 1., 1.])
    ax.set_axis_off()
    fig.add_axes(ax)
    # TODO: Swap color mapping if image is bitmap/8bit
    # plt.set_cmap('gray') if img.invert_colors else plt.set_cmap('Greys')
    plt.set_cmap('Greys')
    if depth_slice:
        logger.debug('Creating Thumbnail from 3D tif')
        ax.imshow(img[depth_slice,:,:], aspect='equal', vmin=0, vmax=255)
    else:
        logger.debug('Creating Thumbnail from FLAT tif')
        ax.imshow(img, aspect='equal')

    buffer = io.BytesIO()
    plt.savefig(buffer, format='jpeg', dpi=dpi)
    buffer.seek(0)
    
    plt.close(fig)

    return buffer.getvalue()

def create_histogram(img):
    logger.debug('Creating Histogram')
    nbins=256
    fig_hist = plt.figure(figsize=(4,2.4))
    freq, bins, patches = plt.hist(img.reshape([np.size(img),]), nbins, density=True)
    plt.xlabel('Gray value')
    plt.ylabel('Probability')
    plt.tight_layout()

    image_buffer = io.BytesIO()
    fig_hist.savefig(image_buffer, format='jpeg', dpi=200)
    image_buffer.seek(0)
    plt.close(fig_hist)

    csv_buffer = io.StringIO()
    histwriter = csv.writer(csv_buffer,delimiter=',')
    histwriter.writerow(('Value','Probability'))
    for i in range(np.size(freq)):
        histwriter.writerow((bins[i],freq[i]))
    csv_buffer.seek(0)

    logger.debug('Histogram Created')

    return image_buffer.getvalue(), csv_buffer.getvalue()

def create_animation(img):
    """
    Creates an animated GIF in memory using matplotlib and returns its binary data.

    Args:
        img (ndarray): The input 3D image as a NumPy array.

    Returns:
        bytes: Binary data of the animated GIF.
    """
    if len(img.shape) < 3 or (len(img.shape) == 3 and 3 in img.shape):
        logger.debug('Image is not a 3D array')
        return  # Exit if the image is not a 3D array

    logger.debug('Creating Animated Gif')

    class AnimatedGif:
        def __init__(self):
            self.fig = plt.figure()
            self.images = []

        def add(self, image, h, w, dpi=100):
            self.fig.set_size_inches(w, h, dpi)
            ax1 = plt.Axes(self.fig, [0., 0., 1., 1.])
            ax1.set_axis_off()
            self.fig.add_axes(ax1)
            plt.set_cmap('Greys')
            plt_im = ax1.imshow(image, aspect='equal', vmin=0, vmax=255)
            self.images.append([plt_im])

        def save_to_tempfile(self):
            """Saves the animation to a temporary file and returns its binary content."""
            with tempfile.NamedTemporaryFile(suffix=".gif", delete=True) as temp_file:
                animation = anim.ArtistAnimation(self.fig, self.images)
                animation.save(temp_file.name, writer='imagemagick', fps=6)
                temp_file.seek(0)  # Reset pointer to the beginning
                return temp_file.read()  # Read binary content

    # Resize the image while preserving aspect ratio
    dim_max = 5
    width, height = img.shape[2], img.shape[1]
    modifier = dim_max / width if width > height else dim_max / height
    resized_width, resized_height = width * modifier, height * modifier

    # Create the animation
    sl1 = img[0, :, :]
    animated_gif = AnimatedGif()
    animated_gif.add(sl1, h=resized_height, w=resized_width)

    if img.shape[0] < 100:
        slicesave = 1
    else:
        slicesave = round((img.shape[0] / 100) * 1)

    for i in range(1, img.shape[0], slicesave):
        sl = img[i, :, :]
        animated_gif.add(sl, h=resized_height, w=resized_width)

    # Save the animation to a temporary file and return its binary data
    gif_binary_data = animated_gif.save_to_tempfile()

    logger.debug('Animated Gif Created')
    return gif_binary_data

def resize_cover_image(img):
    
    max_size = 500
    image = Image.open(img)
    (width, height) = image.size

    _, ext = os.path.splitext(img.name)

    if width > max_size or height > max_size:
        # Calculate the resizing modifier
        modifier = max_size / width if width > height else max_size / height
        resized_width = width * modifier
        resized_height = height * modifier
        size = (round(resized_width), round(resized_height))

        # Resize the image
        image = image.resize(size, Image.Resampling.LANCZOS)

        format_map = {
            '.jpg': 'JPEG',
            '.jpeg': 'JPEG',
            '.png': 'PNG',
            '.gif': 'GIF',
        }

        # Save the resized image to a binary stream
        buffer = io.BytesIO()
        image.save(buffer, format=format_map[ext])  # Preserve the original format
        buffer.seek(0)  # Reset the stream's position to the beginning

        # Clean up
        image.close()

        return buffer.getvalue()
