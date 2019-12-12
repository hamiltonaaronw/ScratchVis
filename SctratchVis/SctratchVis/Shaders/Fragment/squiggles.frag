#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform float uTime;
uniform vec2 uRes;
uniform float[256] uSpectrum;

out vec4 retColor;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

float hash(vec2 p, float s)
{
	vec3 p2 = vec3(p.xy, 27.0 * abs(sin(s)));
	float ret = fract(sin(dot(p2, vec3(27.1, 61.7, 12.4))) * 2.1);
	return ret;
}

float noise(vec2 p, float s)
{
	vec2 i = floor(p);
	vec2 f = fract(p);

	f *= f * (3.0 - 2.0 * f);

	float ret = mix(mix(hash(i + vec2(0.0, 0.0), s), hash(i + vec2(1.0, 0.0), s), f.x),
					mix(hash(i + vec2(0.0, 1.0), s), hash(i + vec2(1.0, 1.0), s), f.x),
					f.y) * s;

	return ret;
}

float fbm(vec2 p)
{
	float v = -4.0;
	v += noise(p * 2.0, 0.4);
	v += 0.5 - noise(-p * 4.0, 0.27);

	float ret = 20.0 * length(sin(v * 3.0) + cos(v * 0.85));
	return ret;
}

float lanczosKernel(int ai, float x)
{
	float ret;
	float af = float(ai);

	if (x == 0.0)
		return 1.0;
	if (-af <= x && x < af)
		return (af * sin(PI * x) * sin((PI * x) / af)) / ((PI * PI) * (x * x));
	else
		return 0;
}

float lanczosInterp(int ai, float x)
{
	float ret = 0.0;
	int ub = int(floor(x));
	int lb = int(floor(x)) - ai + 1;

	for (int i = lb; i <= ub; i++)
	{
		ret += uSpectrum[i] * lanczosKernel(ai, x - float(i));
		//ret = mod(abs(ret), 1.0);
	}

	return abs(ret);
}

mat2 rot(float a)
{
	mat2 ret = mat2(
		cos(a), sin(a),
		-sinc(a), cos(a)
	);

	return ret;
}

float perlin(vec2 p, float f)
{
	mat2 m = mat2(2.0);
	float v = 0.0;
	float s = 1.0;

	for (int i = 0; i < 7; i++, s /= 2.0)
	{
		v += s * noise(p, f);
		p *= m;
	}

	return v;
} 

float wave(float sz, float sp, float st, float t, vec2 p)
{
	return cos(length(p * sz) - t * sp) * (st * max(0.0, (1.0 - length(p))));
}

float wavein(float sz, float sp, float st, float t, vec2 p)
{
	return cos(length(p * sz * (sin(t * 2.0) * 0.3 + 1.0)) + t * sp) * (st * max(0.0, (1.0 - length(p))));
}

float sinpp(float a)
{
	return (sin(a) + 1.0) * 0.5;
}

float cospp(float a)
{
	return (cos(a) + 1.0) * 0.5;
}

vec3 col(vec2 p)
{
	float f = min(abs(uFreq), abs(uLastFreq)) + abs(uDeltaFreq / 2.0);
	float ff = fract(f * 100.0);
	float lkf = lanczosKernel(2, f);
	float lkff = lanczosKernel(2, ff);
	float lif = lanczosInterp(3, sin(f) * 100.0 * TAU);
	float liff = lanczosInterp(3, sin(ff) * 1000.0 * TAU / p.x);

	float fd = min(f, lif) / max(f, lif);
	fd = mod(fd, 1.0);
	float ffd = max(ff, liff) / min(ff, liff);
	fd = mod(fd, 1.0);

	float fp = perlin(p, f);
	float fps = fp * uSpectrum[int(floor(ff * 100.0))];

	vec2 q = (p + fp + fps) * 0.5;


	float t = uTime + fp * lkff;

	vec3 c = vec3(q.x, q.y, (q.x * q.y) * sinpp(t * sin(fps)) + (q.x + q.y) * cospp(t * fps));

	c += wave(17.0, 7.0, fps * lkff, t * lkf, p);
	c += wave(27.0, 8.0, fps - lkff, t, p + 0.03);
	c += wavein(100.0, 8.0, fps + lkff, t, p - 0.02);

	vec3 ret = c;

	return ret;

}

void main()
{
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 0.55;
	vec4 ret;

	ret = vec4(col(uv), 1.0);

	retColor = ret;
}
