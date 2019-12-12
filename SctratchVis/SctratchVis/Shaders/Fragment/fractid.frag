#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform float uTime;
uniform float[256] uSpectrum;
uniform vec2 uRes;

out vec4 retColor;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
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
	return mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
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

float circ(vec2 p)
{
	float r = length(p);
	r = log(sqrt(r));

	float ret = abs(mod(r * 4.0, TAU) - PI) * 3.0 + 0.2;

	return ret;
}

vec3 col(vec2 p)
{
	vec3 ret;

	float f = (abs(uFreq) + abs(uLastFreq)) * 0.5;
	float ff = fract(f * 100.0);
	float lif = lanczosInterp(3, f);
	float liff = lanczosInterp(3, ff);

	float fd = min(f, lif) / max(f, lif);
	fd = mod(fd, 1.0);
	float ffd = max(ff, liff) / min(ff, liff);
	ffd = mod(ffd, 1.0);

	float t = TAU * uTime / 5.0 * 0.05;
	t += lif;

	vec2 q = p - 0.5;
	q.x *= uRes.x / uRes.y;
	q *= 6.0;

	float fp = perlin(q, f);
	float fps = fp * uSpectrum[int(floor(ff * 100.0))];

	float lw = 0.1 * atan(fd, fps);
	float w = lw / 3.0 + f / (uTime);

	q.x += w * cos(mod(fps, 0.5) * t + 30.0 * q.y * fp);
	q.y += w * sin(mod(fps, 0.5) * t + 30.0 * q.x * fps);

	q /= exp(mod(t * 10.0, PI));
	//q *= rot(uTime);

	float v = circ(q);
	float d = 0.4 + lif;
	d *= pow(abs(fps - v), 0.9);

	vec3 lc = vec3(fp, 0.2 * fps, ff);

	vec3 c = lc / abs(d - sinc(fp / lw));

	c = pow(abs(c), vec3(0.99));

	ret = c;

	return ret;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy / uRes) - 0.5;

	vec4 ret;

	vec3 c = col(uv);
	float a = smoothstep(0.0, 0.1, min(min(c.r, c.g), c.b));

	ret = vec4(c, a);


	retColor = ret;
}